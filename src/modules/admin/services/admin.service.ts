import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalTryout,
      totalActiveTryout,
      totalUpcomingTryout,
      totalEndedTryout,
      totalUser,
      activeUser,
      totalAdmin,
      totalRevenueAggregate,
      totalPendingPayment,
      monthlyRevenueRaw,
      monthlyUserGrowthRaw,
      weeklyActivityRaw,
    ] = await Promise.all([
      this.prisma.tryOut.count(),
      this.prisma.tryOut.count({
        where: {
          scheduledStart: { lte: now },
          scheduledEnd: { gte: now },
        },
      }),
      this.prisma.tryOut.count({
        where: {
          scheduledStart: { gt: now },
        },
      }),
      this.prisma.tryOut.count({
        where: {
          scheduledEnd: { lt: now },
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { emailVerified: true },
      }),
      this.prisma.user.count({
        where: { role: 'ADMIN' },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: { status: 'PENDING' },
      }),
      // Monthly Revenue (Confirmed Payments)
      this.prisma.payment.findMany({
        where: { status: 'CONFIRMED', createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
      // Monthly User Growth
      this.prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      // Weekly Active Activity (based on daily question logs)
      this.prisma.dailyQuestionLog.findMany({
        where: { completedAt: { gte: sevenDaysAgo } },
        select: { completedAt: true },
      }),
    ]);

    // Helper to format Month labels
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    // Process Monthly Revenue
    const revenueChart = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      const monthLabel = `${monthNames[d.getMonth()]}`;
      const total = monthlyRevenueRaw
        .filter(
          (p) =>
            p.createdAt.getMonth() === d.getMonth() &&
            p.createdAt.getFullYear() === d.getFullYear(),
        )
        .reduce((sum, p) => sum + p.amount, 0);
      return { label: monthLabel, value: total };
    });

    // Process Monthly User Growth
    const userGrowthChart = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      const monthLabel = `${monthNames[d.getMonth()]}`;
      const count = monthlyUserGrowthRaw.filter(
        (u) =>
          u.createdAt.getMonth() === d.getMonth() &&
          u.createdAt.getFullYear() === d.getFullYear(),
      ).length;
      return { label: monthLabel, value: count };
    });

    // Process Weekly Activity
    const weeklyActivityChart = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const count = weeklyActivityRaw.filter(
        (l) =>
          l.completedAt.getDate() === d.getDate() &&
          l.completedAt.getMonth() === d.getMonth(),
      ).length;
      return { label: dayLabel, value: count };
    });

    return {
      totalTryout,
      totalActiveTryout,
      totalUpcomingTryout,
      totalEndedTryout,
      totalUser,
      activeUser,
      totalAdmin,
      totalRevenue: totalRevenueAggregate._sum.amount || 0,
      totalPendingPayment,
      charts: {
        revenue: revenueChart,
        userGrowth: userGrowthChart,
        weeklyActivity: weeklyActivityChart,
      },
    };
  }
}
