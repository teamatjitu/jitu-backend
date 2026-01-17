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
  getExamStream(attemptId: string): Observable<MessageEvent> {
    return interval(1000).pipe(
      switchMap(async () => {
        const attempt = await this.prisma.tryOutAttempt.findUnique({
          where: { id: attemptId },
          include: { tryOut: { include: { subtests: true } } },
        });

        if (!attempt || attempt.status !== 'IN_PROGRESS') {
          return { data: { status: 'FINISHED', remainingSeconds: 0 } };
        }

        const totalDurationMinutes = attempt.tryOut.subtests.reduce(
          (acc, sub) => acc + sub.durationMinutes,
          0,
        );
        const endTime = new Date(
          attempt.startedAt.getTime() + totalDurationMinutes * 60000,
        );
        const now = new Date();
        const remainingSeconds = Math.max(
          0,
          Math.floor((endTime.getTime() - now.getTime()) / 1000),
        );

        if (remainingSeconds === 0) await this.finishExam(attemptId);

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
