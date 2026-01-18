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

        // 1. Dapatkan durasi subtes-subtes SEBELUMNYA (untuk menentukan start time subtes saat ini)
        const previousSubtestsDurationMinutes = attempt.tryOut.subtests
          .filter((sub) => sub.order < currentOrder)
          .reduce((acc, sub) => acc + sub.durationMinutes, 0);

        // 2. Dapatkan durasi subtes SAAT INI
        const currentSubtest = attempt.tryOut.subtests.find(
          (sub) => sub.order === currentOrder,
        );

        if (!currentSubtest) {
          return { data: { status: 'FINISHED', remainingSeconds: 0 } };
        }
        const currentSubtestDurationSeconds = currentSubtest.durationMinutes * 60;

        // 3. Hitung waktu mulai yang diharapkan untuk subtes ini (berdasarkan waktu mulai ujian dan durasi subtes sebelumnya)
        const subtestExpectedStartTime = new Date(
          attempt.startedAt.getTime() + previousSubtestsDurationMinutes * 60000,
        );

        const now = new Date();

        // 4. Hitung berapa detik yang sudah berlalu sejak subtes ini seharusnya dimulai
        const timeElapsedSinceExpectedStart = Math.max(0, now.getTime() - subtestExpectedStartTime.getTime());
        const timeElapsedSeconds = Math.floor(timeElapsedSinceExpectedStart / 1000);

        // 5. Sisa waktu untuk subtes ini adalah durasi penuh dikurangi waktu yang sudah berlalu
        let remainingSeconds = currentSubtestDurationSeconds - timeElapsedSeconds;

        // 6. Pastikan sisa waktu tidak negatif
        remainingSeconds = Math.max(0, remainingSeconds);

        // 7. Cek juga apakah waktu ujian keseluruhan sudah habis
        const totalExamDurationMinutes = attempt.tryOut.subtests.reduce((acc, s) => acc + s.durationMinutes, 0);
        const totalExamExpiryTime = new Date(attempt.startedAt.getTime() + totalExamDurationMinutes * 60000);
        
        if (now > totalExamExpiryTime) {
            // Jika waktu keseluruhan ujian habis, maka subtes ini juga otomatis selesai
            remainingSeconds = 0; // Pastikan timer menunjukkan 0
        }
        
        // --- Bagian ini di-refactor agar lebih aman ---
        // Cek jika waktu habis untuk subtes ini ATAU keseluruhan ujian
        if (remainingSeconds === 0) {
          const subtestOrders = attempt.tryOut.subtests.map((s) => s.order);
          const maxOrder = subtestOrders.length > 0 ? Math.max(...subtestOrders) : 0;

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
