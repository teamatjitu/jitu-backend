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
    const totalQuestions = await this.prisma.question.count();
    if (totalQuestions === 0) return null;

    // Gunakan tanggal (YYYYMMDD) sebagai SEED
    const now = new Date();
    const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    
    // Pilih index berdasarkan modulus
    const randomIndex = dateSeed % totalQuestions;

    const question = await this.prisma.question.findFirst({
      skip: randomIndex,
      orderBy: { id: 'asc' }, // Pastikan urutan stabil agar random tidak berubah-ubah
      include: {
        items: true,
        subtest: {
          select: {
            name: true,
            tryOut: { select: { title: true } }
          }
        }
      }
    });

    if (!question) return null;

    // Ambil Statistik Pengerjaan untuk soal ini HARI INI
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const [totalAttempts, correctAnswers] = await Promise.all([
      this.prisma.dailyQuestionLog.count({
        where: {
          questionId: question.id,
          completedAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      this.prisma.dailyQuestionLog.count({
        where: {
          questionId: question.id,
          isCorrect: true,
          completedAt: { gte: todayStart, lte: todayEnd }
        }
      })
    ]);

    return {
      ...question,
      stats: {
        totalAttempts,
        correctAnswers,
        incorrectAnswers: totalAttempts - correctAnswers,
        successRate: totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0
      }
    };
  }
}
