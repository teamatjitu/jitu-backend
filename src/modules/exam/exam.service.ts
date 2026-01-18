import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service'; // Sesuaikan path ini jika perlu
import { Observable, interval, map, switchMap, of } from 'rxjs';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  async startExam(tryOutId: string, userId: string) {
    const existing = await this.prisma.tryOutAttempt.findFirst({
      where: { userId, tryOutId, status: 'IN_PROGRESS' },
    });

    if (existing) return existing;

    return this.prisma.tryOutAttempt.create({
      data: {
        userId,
        tryOutId,
        status: 'IN_PROGRESS',
        totalScore: 0,
        startedAt: new Date(),
      },
    });
  }

  // SSE untuk memperbarui waktu
  // exam.service.ts

  getExamStream(
    attemptId: string,
    currentOrder: number,
  ): Observable<MessageEvent> {
    return interval(1000).pipe(
      switchMap(async () => {
        const attempt = await this.prisma.tryOutAttempt.findUnique({
          where: { id: attemptId },
          include: {
            tryOut: {
              include: {
                subtests: { orderBy: { order: 'asc' } }, // Pastikan urut
              },
            },
          },
        });

        if (!attempt || attempt.status !== 'IN_PROGRESS') {
          return { data: { status: 'FINISHED', remainingSeconds: 0 } };
        }

        // 1. Hitung durasi kumulatif sampai subtes saat ini
        // Misal: user di subtes order 2, maka total menit = durasi subtes 1 + subtes 2
        const cumulativeMinutes = attempt.tryOut.subtests
          .filter((sub) => sub.order <= currentOrder)
          .reduce((acc, sub) => acc + sub.durationMinutes, 0);

        // 2. Tentukan waktu berakhir untuk SUBTES INI
        const subtestEndTime = new Date(
          attempt.startedAt.getTime() + cumulativeMinutes * 60000,
        );

        const now = new Date();

        // 3. Hitung sisa waktu
        const remainingSeconds = Math.max(
          0,
          Math.floor((subtestEndTime.getTime() - now.getTime()) / 1000),
        );

        // 4. Jika waktu habis untuk subtes ini
        if (remainingSeconds === 0) {
          // Cek apakah ini subtes terakhir
          const maxOrder = Math.max(
            ...attempt.tryOut.subtests.map((s) => s.order),
          );

          if (currentOrder >= maxOrder) {
            await this.finishExam(attemptId);
            return { data: { status: 'FINISHED', remainingSeconds: 0 } };
          } else {
            // Kirim status agar frontend otomatis pindah subtes
            return {
              data: { status: 'SUBTEST_FINISHED', remainingSeconds: 0 },
            };
          }
        }

        return {
          data: {
            status: 'IN_PROGRESS',
            remainingSeconds,
            serverTime: new Date().toISOString(),
          },
        };
      }),
      map((data) => ({ data }) as MessageEvent),
    );
  }
  // --- PERBAIKAN UTAMA DI SINI ---
  async saveAnswer(
    attemptId: string,
    questionId: string,
    questionItemId?: string,
    inputText?: string,
  ) {
    // LOG INPUT DARI CONTROLLER
    console.log('📥 SAVE ANSWER REQUEST:', {
      attemptId,
      questionId,
      questionItemId,
      inputText,
    });

    try {
      let isCorrect = false;

      // VALIDASI 1: Pilihan Ganda / Benar-Salah
      if (questionItemId) {
        const selectedItem = await this.prisma.questionItem.findUnique({
          where: { id: questionItemId },
        });

        if (!selectedItem) {
          throw new BadRequestException(
            `ID Pilihan jawaban tidak ditemukan: ${questionItemId}`,
          );
        }
        isCorrect = selectedItem.isCorrect;
      }
      // VALIDASI 2: Isian Singkat
      else if (typeof inputText !== 'undefined') {
        // Cek undefined agar string kosong "" tetap diproses

        // Query Question
        const question = await this.prisma.question.findUnique({
          where: { id: questionId },
        });

        // Debug: Cek apakah question ditemukan
        if (!question) {
          throw new BadRequestException(
            `Soal dengan ID ${questionId} tidak ditemukan`,
          );
        }

        console.log('🔎 SOAL DITEMUKAN:', question);

        // Debug: Cek field correctAnswer (apakah null atau ada isinya)
        const key = question.correctAnswer;

        if (key) {
          // Pastikan kedua sisi adalah string sebelum trim()
          const userAnswer = String(inputText).trim().toLowerCase();
          const correctKey = String(key).trim().toLowerCase();

          isCorrect = userAnswer === correctKey;
          console.log(
            `📝 GRADING: User='${userAnswer}' vs Key='${correctKey}' => ${isCorrect}`,
          );
        } else {
          console.warn(
            `⚠️ Soal ID ${questionId} tidak memiliki kunci jawaban (correctAnswer null).`,
          );
        }
      } else {
        // Jika questionItemId null DAN inputText undefined
        console.warn('⚠️ Tidak ada jawaban yang dikirim (kosong)');
      }

      // SIMPAN KE DB
      console.log('💾 MENYIMPAN KE DB...', { isCorrect });

      const result = await this.prisma.userAnswer.upsert({
        where: {
          tryOutAttemptId_questionId: {
            tryOutAttemptId: attemptId,
            questionId: questionId,
          },
        },
        update: {
          questionItemId: questionItemId || null,
          inputText: inputText || null,
          isCorrect: isCorrect,
          updatedAt: new Date(),
        },
        create: {
          tryOutAttemptId: attemptId,
          questionId: questionId,
          questionItemId: questionItemId || null,
          inputText: inputText || null,
          isCorrect: isCorrect,
        },
      });

      console.log('✅ BERHASIL DISIMPAN');
      return result;
    } catch (error) {
      // LOG ERROR LENGKAP
      console.error('❌ CRITICAL ERROR DI SAVE ANSWER:', error);

      if (error instanceof BadRequestException) throw error;

      // Tampilkan pesan error asli ke frontend untuk debugging
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      throw new InternalServerErrorException(`Server Error: ${errorMessage}`);
    }
  }

  async finishSubtest(attemptId: string, finishedSubtestOrder: number) {
    const attempt = await this.prisma.tryOutAttempt.findUnique({
      where: { id: attemptId },
      include: { tryOut: { include: { subtests: true } } },
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Attempt not found or not in progress.');
    }

    const expectedDurationMillis =
      attempt.tryOut.subtests
        .filter((sub) => sub.order <= finishedSubtestOrder)
        .reduce((acc, sub) => acc + sub.durationMinutes, 0) * 60000;

    const actualTimeSpentMillis = new Date().getTime() - attempt.startedAt.getTime();

    const timeDifference = expectedDurationMillis - actualTimeSpentMillis;

    if (timeDifference > 0) {
      // User finished early, "fast-forward" the start time
      const newStartedAt = new Date(attempt.startedAt.getTime() + timeDifference);
      return this.prisma.tryOutAttempt.update({
        where: { id: attemptId },
        data: { startedAt: newStartedAt },
      });
    }

    // If user finished late or on time, do nothing to the timer
    return attempt;
  }

  async finishExam(attemptId: string) {
    // 1. Ambil semua jawaban user untuk attempt ini
    const answers = await this.prisma.userAnswer.findMany({
      where: { tryOutAttemptId: attemptId },
      include: { question: true },
    });

    // 2. Hitung total skor berdasarkan poin soal yang benar
    const totalScore = answers.reduce((acc, curr) => {
      return curr.isCorrect ? acc + (curr.question.points || 0) : acc;
    }, 0);

    // 3. Update status DAN skor secara bersamaan
    return this.prisma.tryOutAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'FINISHED',
        totalScore: totalScore,
        finishedAt: new Date(),
      },
    });
  }
}