import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';
import { SubtestName } from '../../../generated/prisma/client';
import { ExamService } from '../exam/exam.service';

@Injectable()
export class TryoutService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ExamService))
    private readonly examService: ExamService,
  ) {}

  /**
   * Helper: Map TryOut entity -> TryoutDetailDto
   */
  private mapTryoutToDto(
    tryout: any,
    answeredQuestionIds?: Set<string>,
  ): TryoutDetailDto {
    const totalQuestions = (tryout.subtests ?? []).reduce(
      (sum: number, s: any) => sum + (s.questions?.length ?? 0),
      0,
    );

    const totalDuration = (tryout.subtests ?? []).reduce(
      (sum: number, s: any) => sum + (s.durationMinutes ?? 0),
      0,
    );

    const answeredSet = answeredQuestionIds ?? new Set<string>();

    return {
      id: tryout.id,
      title: tryout.title,
      number: tryout.code?.toString() ?? '0',
      badge: tryout.batch,
      participants: tryout._count?.attempts ?? 0,
      description: tryout.description ?? '',
      duration: totalDuration,
      totalQuestions,
      startDate: tryout.scheduledStart?.toISOString() ?? '',
      endDate: tryout.scheduledEnd?.toISOString() ?? '',
      isRegistered: (tryout.attempts?.length ?? 0) > 0,
      isFree: tryout.solutionPrice === 0,
      tokenCost: tryout.solutionPrice,
      unlockedSolutions: tryout.unlockedSolutions ?? [], // FIX: Mapping data unlock
      categories: (tryout.subtests ?? [])
        .slice()
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((s: any) => {
          const qIds = (s.questions ?? []).map((q: any) => String(q.id));
          const answeredCount = qIds.filter((id: string) =>
            answeredSet.has(id),
          ).length;

          return {
            id: Number(s.order),
            name: s.name,
            questionCount: s.questions?.length ?? 0,
            duration: s.durationMinutes,
            isCompleted:
              (s.questions?.length ?? 0) > 0 &&
              answeredCount === (s.questions?.length ?? 0),
          };
        }),
      benefits: ['Pembahasan lengkap', 'Analisis hasil', 'Simulasi UTBK'],
      requirements: ['Akun terverifikasi', 'Token mencukupi'],
    };
  }

  async registerTryout(userId: string, tryoutId: string) {
    // 1. Cek Tryout
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id: tryoutId },
    });
    if (!tryout) throw new NotFoundException('Tryout tidak ditemukan');

    // 2. Cek apakah user sudah terdaftar (punya attempt apa saja)
    const existingAttempt = await this.prisma.tryOutAttempt.findFirst({
      where: { userId, tryOutId: tryoutId },
    });

    if (existingAttempt) {
      // Sudah terdaftar, kembalikan attemptId yang ada
      return {
        message: 'User sudah terdaftar pada tryout ini',
        attemptId: existingAttempt.id,
        isRegistered: true,
      };
    }

    const price = tryout.solutionPrice;

    // 3. Jika Gratis (Price <= 0)
    if (price <= 0) {
      const newAttempt = await this.prisma.tryOutAttempt.create({
        data: {
          userId,
          tryOutId: tryoutId,
          status: 'NOT_STARTED',
          totalScore: 0,
          currentSubtestOrder: 0,
        },
      });
      return {
        message: 'Berhasil mendaftar tryout gratis',
        attemptId: newAttempt.id,
        isRegistered: true,
      };
    }

    // 4. Jika Berbayar
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });

    if (!user || user.tokenBalance < price) {
      throw new BadRequestException('Saldo Token tidak mencukupi untuk mendaftar tryout ini');
    }

    // Transaksi pembayaran & pendaftaran
    const result = await this.prisma.$transaction(async (tx) => {
      // Potong Saldo
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: price } },
      });

      // Catat Transaksi
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -price,
          type: 'PURCHASE_TRYOUT',
          referenceId: tryoutId,
        },
      });

      // Buat Attempt (Registration)
      const attempt = await tx.tryOutAttempt.create({
        data: {
          userId,
          tryOutId: tryoutId,
          status: 'NOT_STARTED',
          totalScore: 0,
          currentSubtestOrder: 0,
        },
      });

      // [FIX] Unlock Pembahasan Otomatis jika berbayar
      // Karena user sudah membayar di awal (registration fee),
      // maka pembahasan harusnya include.
      await tx.unlockedSolution.create({
        data: {
          userId,
          tryOutId: tryoutId,
        },
      });
      
      return attempt;
    });

    return {
      message: 'Berhasil mendaftar tryout berbayar',
      attemptId: result.id,
      isRegistered: true,
    };
  }

  /**
   * Logic: Unlock Pembahasan menggunakan Token
   */
  async unlockSolution(userId: string, tryoutId: string) {
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id: tryoutId },
      select: { solutionPrice: true, title: true },
    });

    if (!tryout) throw new NotFoundException('Tryout tidak ditemukan');

    // 1. Cek apakah sudah di-unlock
    const existingUnlock = await this.prisma.unlockedSolution.findFirst({
      where: { userId, tryOutId: tryoutId },
    });
    if (existingUnlock) return { message: 'Pembahasan sudah terbuka' };

    // 2. Cek saldo user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });

    if (!user || user.tokenBalance < tryout.solutionPrice) {
      throw new BadRequestException('Saldo Token tidak mencukupi');
    }

    // 3. Transaksi (Potong Saldo & Unlock)
    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: tryout.solutionPrice } },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -tryout.solutionPrice,
          type: 'PURCHASE_SOLUTION',
          referenceId: tryoutId,
        },
      });

      return await tx.unlockedSolution.create({
        data: { userId, tryOutId: tryoutId },
      });
    });
  }

  async getTryouts(): Promise<TryOutCardDto[]> {
    const tryouts = await this.prisma.tryOut.findMany({
      include: {
        _count: { select: { attempts: true } },
      },
      orderBy: { scheduledStart: 'desc' },
    });

    return tryouts.map((t) => ({
      id: t.id,
      title: t.title,
      number: t.code.toString(),
      canEdit: false,
      participants: t._count.attempts,
      badge: t.batch,
      solutionPrice: t.solutionPrice, // Add solutionPrice
      isPublic: t.isPublic,
    }));
  }

  async getTryoutById(id: string, userId?: string): Promise<TryoutDetailDto> {
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id },
      include: {
        subtests: {
          include: {
            questions: { select: { id: true } },
          },
        },
        attempts: userId
          ? {
              where: { userId },
              select: {
                id: true,
                status: true,
                startedAt: true,
                finishedAt: true,
              },
              orderBy: { startedAt: 'desc' },
            }
          : false,
        _count: { select: { attempts: true } },
        unlockedSolutions: userId ? { where: { userId } } : false, // FIX: Sertakan data unlock
      },
    });

    if (!tryout) throw new NotFoundException('Tryout not found');

    let answeredQuestionIds = new Set<string>();
    if (
      userId &&
      Array.isArray(tryout.attempts) &&
      tryout.attempts.length > 0
    ) {
      const inProgress = tryout.attempts.find(
        (a: any) => a.status === 'IN_PROGRESS',
      );
      if (inProgress?.id) {
        const answers = await this.prisma.userAnswer.findMany({
          where: { tryOutAttemptId: String(inProgress.id) },
          select: { questionId: true },
        });
        answeredQuestionIds = new Set<string>(
          answers.map((a) => String(a.questionId)),
        );
      }
    }

    let latestFinishedAttemptId: string | null = null;
    let latestAttemptStatus:
      | 'IN_PROGRESS'
      | 'FINISHED'
      | 'NOT_STARTED'
      | null = null;
    let latestAttemptId: string | null = null;
    let currentSubtestOrder = 1;
    let latestScore = 0;

    if (userId) {
      const latestAttempt = await this.prisma.tryOutAttempt.findFirst({
        where: { userId, tryOutId: id },
        orderBy: { startedAt: 'desc' },
        select: { id: true, status: true, currentSubtestOrder: true },
      });
      latestAttemptStatus = (latestAttempt?.status as any) ?? null;
      latestAttemptId = latestAttempt?.id ?? null;
      currentSubtestOrder = latestAttempt?.currentSubtestOrder ?? 1;

      const latestFinished = await this.prisma.tryOutAttempt.findFirst({
        where: { userId, tryOutId: id, status: 'FINISHED' },
        orderBy: { finishedAt: 'desc' },
        select: { id: true, totalScore: true },
      });
      latestFinishedAttemptId = latestFinished?.id ?? null;
      latestScore = latestFinished?.totalScore ? Math.round(latestFinished.totalScore) : 0;
    }

    const dto = this.mapTryoutToDto(tryout, answeredQuestionIds);
    return {
      ...dto,
      latestFinishedAttemptId,
      latestAttemptStatus,
      latestAttemptId,
      currentSubtestOrder,
      latestScore,
    };
  }

  async getSubtestQuestions(
    tryOutId: string,
    subtestIdOrOrder: string | number,
    userId: string, // Wajibkan userId demi keamanan
    attemptId?: string,
  ) {
    let subtest: any;
    const order = Number(subtestIdOrOrder);

    if (!isNaN(order)) {
      subtest = await this.prisma.subtest.findFirst({
        where: { tryOutId, order },
      });
    } else {
      subtest = await this.prisma.subtest.findFirst({
        where: {
          tryOutId,
          OR: [
            { id: String(subtestIdOrOrder) },
            { name: String(subtestIdOrOrder) as SubtestName },
          ],
        },
      });
    }

    if (!subtest) throw new NotFoundException('Subtest tidak ditemukan');

    let currentAttempt: any = null;
    const hasAttemptId =
      !!attemptId && attemptId !== 'undefined' && attemptId !== 'null';

    if (hasAttemptId) {
      currentAttempt = await this.prisma.tryOutAttempt.findUnique({
        where: { id: String(attemptId) },
        include: { tryOut: { include: { subtests: true } } },
      });
    } else {
      currentAttempt = await this.prisma.tryOutAttempt.findFirst({
        where: { userId, tryOutId, status: 'IN_PROGRESS' },
        orderBy: { startedAt: 'desc' },
        include: { tryOut: { include: { subtests: true } } },
      });
    }

    // --- AUTO FINISH LOGIC (DIPERBAIKI) ---
    if (currentAttempt && currentAttempt.status === 'IN_PROGRESS') {
      const totalDuration = currentAttempt.tryOut.subtests.reduce(
        (acc, s) => acc + (s.durationMinutes || 0),
        0,
      );
      const expiryTime = new Date(
        currentAttempt.startedAt.getTime() + totalDuration * 60000,
      );

      if (new Date() > expiryTime) {
        // Gunakan ExamService untuk finish agar logic skor konsisten
        currentAttempt = await this.examService.finishExam(currentAttempt.id);
        
        // Reload attempt dengan relation yang dibutuhkan
        currentAttempt = await this.prisma.tryOutAttempt.findUnique({
            where: { id: currentAttempt.id },
            include: { tryOut: { include: { subtests: true } } },
        });
      }
    }

    if (!currentAttempt) {
      currentAttempt = await this.prisma.tryOutAttempt.findFirst({
        where: { userId, tryOutId, status: 'FINISHED' },
        orderBy: { finishedAt: 'desc' },
      });
    }

    if (!currentAttempt) throw new NotFoundException('Sesi tidak ditemukan');

    const isReviewMode = currentAttempt.status === 'FINISHED';

    // [SECURITY] Cegah skip subtest atau akses subtest masa lalu/depan
    // Standar UTBK: User HANYA boleh ada di subtes yang sedang aktif.
    if (!isReviewMode && currentAttempt.status === 'IN_PROGRESS') {
        const requestedOrder = subtest.order;
        const currentOrder = currentAttempt.currentSubtestOrder;

        if (requestedOrder !== currentOrder) {
            throw new ForbiddenException(
                requestedOrder < currentOrder 
                ? `Waktu subtes ini sudah habis. Kamu tidak bisa kembali.`
                : `Kamu belum bisa mengerjakan subtes ini. Selesaikan subtes sebelumnya dahulu.`
            );
        }
    }

    // --- PROTEKSI PEMBAHASAN BERBAYAR ---
    if (isReviewMode) {
      const tryout = await this.prisma.tryOut.findUnique({
        where: { id: tryOutId },
        select: { solutionPrice: true },
      });

      if (tryout && tryout.solutionPrice > 0) {
        const isUnlocked = await this.prisma.unlockedSolution.findFirst({
          where: { userId, tryOutId },
        });
        if (!isUnlocked) {
          throw new ForbiddenException(
            'Pembahasan terkunci. Silakan beli terlebih dahulu.',
          );
        }
      }
    }

    const questions = await this.prisma.question.findMany({
      where: { subtestId: subtest.id },
      orderBy: { id: 'asc' },
      include: {
        items: { orderBy: { order: 'asc' } },
        userAnswers: { where: { tryOutAttemptId: currentAttempt.id } },
      },
    });

    const tryoutInfo = await this.prisma.tryOut.findUnique({
      where: { id: tryOutId },
      include: {
        subtests: {
          include: {
            _count: { select: { questions: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      subtestId: subtest.order,
      subtestName: subtest.name,
      tryOutId,
      tryoutTitle: tryoutInfo?.title || 'Tryout',
      durationMinutes: subtest.durationMinutes,
      allSubtests: tryoutInfo?.subtests.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        durationMinutes: s.durationMinutes,
        questionCount: s._count.questions,
      })),
      questions: questions.map((q: any) => {
        const ua = q.userAnswers?.[0];
        const correctItem = q.items.find((i: any) => i.isCorrect);

        return {
          id: q.id,
          type: q.type,
          questionText: q.content,
          solution: isReviewMode
            ? q.explanation || 'Tidak ada pembahasan.'
            : null,
          correctAnswerText: isReviewMode ? q.correctAnswer : null,
          // FIX: Agar soal kosong tidak dianggap benar (null === null)
          correctAnswerId: isReviewMode ? (correctItem?.id ?? 'NO_KEY') : null,
          options: q.items.map((i: any) => ({
            id: i.id,
            text: i.content,
            order: i.order,
            isCorrect: isReviewMode ? i.isCorrect : undefined,
          })),
          userAnswer: ua
            ? {
                questionItemId: ua.questionItemId,
                inputText: ua.inputText,
                isCorrect: isReviewMode ? ua.isCorrect : false,
              }
            : {
                questionItemId: null,
                inputText: null,
                isCorrect: false, // User tidak jawab = Salah
              },
        };
      }),
      isReviewMode,
      attemptId: currentAttempt.id,
    };
  }
}
