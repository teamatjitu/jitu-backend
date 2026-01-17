import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { auth } from '../../lib/auth'; // 👈 SESUAIKAN PATH INI ke file auth.ts kamu

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    // ... (Kode getProfile sama seperti sebelumnya, tidak berubah)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        tryOutAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: { tryOut: { select: { title: true, batch: true } } },
        },
        _count: { select: { tryOutAttempts: true } },
      },
    });

    if (!user) return null;

    const totalScore = user.tryOutAttempts.reduce((acc, curr) => acc + curr.totalScore, 0);
    const averageScore = user.tryOutAttempts.length > 0 ? totalScore / user.tryOutAttempts.length : 0;

    const hasPassword = user.accounts.some(
      (acc) => acc.providerId === 'credential' || (acc.password && acc.password.length > 0),
    );

    return {
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        tokenBalance: user.tokenBalance,
        target: user.target,
        hasPassword,
      },
      stats: {
        totalTryout: user._count.tryOutAttempts,
        averageScore: Math.round(averageScore),
        lastScore: user.tryOutAttempts[0]?.totalScore || 0,
        streak: user.currentStreak,
      },
      attempts: user.tryOutAttempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.tryOut.title,
        date: attempt.startedAt,
        score: attempt.totalScore,
        status: attempt.totalScore > 700 ? 'EXCELLENT' : 'COMPLETED',
      })),
    };
  }

  async updateProfile(userId: string, data: { name?: string; target?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name, target: data.target },
    });
  }

  // --- TAMBAHKAN FUNGSI INI ---
  async setPassword(headers: Headers, newPassword: string) {
    // Memanggil internal API Better Auth menggunakan headers dari request user
    return auth.api.setPassword({
      body: { newPassword },
      headers: headers, // Penting: Mengirim session cookie user
    });
  }
}
