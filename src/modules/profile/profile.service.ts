import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tryOutAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: {
            tryOut: {
              select: { title: true, batch: true },
            },
          },
        },
        _count: {
          select: { tryOutAttempts: true },
        },
      },
    });

    if (!user) return null;

    const totalScore = user.tryOutAttempts.reduce(
      (acc, curr) => acc + curr.totalScore,
      0,
    );
    const averageScore =
      user.tryOutAttempts.length > 0
        ? totalScore / user.tryOutAttempts.length
        : 0;

    return {
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        tokenBalance: user.tokenBalance,
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
}
