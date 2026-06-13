import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

// Types for raw SQL query results
interface MonthlyAggregateResult {
  month: Date;
  total: bigint;
}

interface DailyAggregateResult {
  day: Date;
  count: bigint;
}

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
      monthlyRevenueAgg,
      monthlyUserGrowthAgg,
      weeklyActivityAgg,
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
      // Monthly Revenue using SQL aggregation
      this.prisma.$queryRaw<MonthlyAggregateResult[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month,
               COALESCE(SUM(amount), 0) as total
        FROM "Payment"
        WHERE status = 'CONFIRMED' AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `,
      // Monthly User Growth using SQL aggregation
      this.prisma.$queryRaw<MonthlyAggregateResult[]>`
        SELECT DATE_TRUNC('month', "createdAt") as month,
               COUNT(*) as total
        FROM "user"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `,
      // Weekly Activity using SQL aggregation
      this.prisma.$queryRaw<DailyAggregateResult[]>`
        SELECT DATE_TRUNC('day', "completedAt") as day,
               COUNT(*) as count
        FROM "DailyQuestionLog"
        WHERE "completedAt" >= ${sevenDaysAgo}
        GROUP BY DATE_TRUNC('day', "completedAt")
        ORDER BY day
      `,
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

    // Convert SQL results to map for O(1) lookup
    const revenueMap = new Map<string, number>();
    for (const row of monthlyRevenueAgg) {
      const key = `${new Date(row.month).getFullYear()}-${new Date(row.month).getMonth()}`;
      revenueMap.set(key, Number(row.total));
    }

    const userGrowthMap = new Map<string, number>();
    for (const row of monthlyUserGrowthAgg) {
      const key = `${new Date(row.month).getFullYear()}-${new Date(row.month).getMonth()}`;
      userGrowthMap.set(key, Number(row.total));
    }

    const activityMap = new Map<string, number>();
    for (const row of weeklyActivityAgg) {
      const d = new Date(row.day);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      activityMap.set(key, Number(row.count));
    }

    // Build Monthly Revenue chart
    const revenueChart = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      const monthLabel = monthNames[d.getMonth()];
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { label: monthLabel, value: revenueMap.get(key) || 0 };
    });

    // Build Monthly User Growth chart
    const userGrowthChart = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      const monthLabel = monthNames[d.getMonth()];
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { label: monthLabel, value: userGrowthMap.get(key) || 0 };
    });

    // Build Weekly Activity chart
    const weeklyActivityChart = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return { label: dayLabel, value: activityMap.get(key) || 0 };
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
