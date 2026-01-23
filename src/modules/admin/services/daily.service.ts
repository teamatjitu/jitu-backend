import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AdminDailyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil soal hari ini menggunakan algoritma Deterministik Random.
   * Soal akan berubah setiap hari secara otomatis, tapi tetap sama untuk semua user di hari tersebut.
   */
  async getTodayQuestion() {
    // STABLE SELECTION LOGIC (HASHING)
    // Ambil semua ID soal (ringan karena hanya select ID)
    const questions = await this.prisma.question.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (questions.length === 0) return null;

    // Gunakan Tanggal ISO (YYYY-MM-DD) sebagai Seed yang stabil
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Cari ID dengan Hash Tertinggi (Deterministic)
    let bestId = questions[0].id;
    let maxHash = -1;

    for (const q of questions) {
      const input = q.id + dateStr;
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      hash = Math.abs(hash);

      if (hash > maxHash) {
        maxHash = hash;
        bestId = q.id;
      }
    }

    const question = await this.prisma.question.findUnique({
      where: { id: bestId },
      include: {
        items: true,
        subtest: {
          select: {
            name: true,
            tryOut: { select: { title: true } },
          },
        },
      },
    });

    if (!question) return null;

    // Ambil Statistik Pengerjaan untuk soal ini HARI INI
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const [totalAttempts, correctAnswers] = await Promise.all([
      this.prisma.dailyQuestionLog.count({
        where: {
          questionId: question.id,
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.dailyQuestionLog.count({
        where: {
          questionId: question.id,
          isCorrect: true,
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    return {
      ...question,
      stats: {
        totalAttempts,
        correctAnswers,
        incorrectAnswers: totalAttempts - correctAnswers,
        successRate:
          totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0,
      },
    };
  }
}
