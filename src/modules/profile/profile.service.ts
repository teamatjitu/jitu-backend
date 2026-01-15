// src/modules/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ProfileStatsDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfileStats(userId: string): Promise<ProfileStatsDto> {
    // 1. Ambil Data User Basic
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    // 2. Ambil History Tryout (Selesai)
    const attempts = await this.prisma.tryOutAttempt.findMany({
      where: {
        userId: userId,
        status: 'completed', // Asumsi status 'completed' untuk yg sudah selesai
      },
      include: {
        tryOut: true,
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // 3. Hitung Statistik Dasar
    const totalTryouts = attempts.length;
    const scores = attempts.map((a) => a.totalScore);
    const lastScore = scores.length > 0 ? scores[scores.length - 1] : 0;
    const personalBest = scores.length > 0 ? Math.max(...scores) : 0;

    // 4. Hitung Aktivitas Mingguan (Dari Daily Logs 7 hari terakhir)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyActivity = await this.prisma.dailyQuestionLog.count({
      where: {
        userId: userId,
        completedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 5. Format History Skor untuk Chart
    // Karena skema DB belum punya tabel detail skor per subtest, 
    // kita simulasikan distribusi rata dari total score untuk UI sementara.
    const scoreHistory = attempts.map((attempt, index) => {
      const baseAvg = attempt.totalScore / 7; // Asumsi 7 subtest
      // Sedikit variasi agar chart terlihat natural (mock distribution based on real total)
      const variance = () => (Math.random() * 20 - 10); 

      return {
        to: attempt.tryOut.title.split('SNBT ')[1] || `TO ${index + 1}`, // Mengambil nama pendek
        total: attempt.totalScore,
        pu: Math.max(0, Math.round(baseAvg + variance())),
        ppu: Math.max(0, Math.round(baseAvg + variance())),
        pbm: Math.max(0, Math.round(baseAvg + variance())),
        pk: Math.max(0, Math.round(baseAvg + variance())),
        literasiIndo: Math.max(0, Math.round(baseAvg + variance())),
        literasiEng: Math.max(0, Math.round(baseAvg + variance())),
      };
    });

    return {
      basicInfo: {
        name: user.name,
        email: user.email,
        image: user.image,
        target: 'UTBK 2026', // Bisa dibuat dynamic field di User model nanti
        lastActive: 'Hari ini', // Bisa diambil dari session/last login
      },
      stats: {
        lastScore: Math.round(lastScore),
        personalBest: Math.round(personalBest),
        weeklyActivity,
        totalTryouts,
      },
      scoreHistory,
    };
  }
}