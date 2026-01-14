import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const totalTryout = await this.prisma.tryOut.count();
    const totalActiveTryout = await this.prisma.tryOut.count({
      where: {
        scheduledStart: { lte: new Date() },
        scheduledEnd: { gte: new Date() },
      },
    });
    const totalUpcomingTryout = await this.prisma.tryOut.count({
      where: {
        scheduledStart: { gt: new Date() },
      },
    });
    const totalEndedTryout = await this.prisma.tryOut.count({
      where: {
        scheduledEnd: { lt: new Date() },
      },
    });

    const totalUser = await this.prisma.user.count();
    const activeUser = await this.prisma.user.count({
      where: { emailVerified: true },
    });
    const totalAdmin = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    return {
      totalTryout,
      totalActiveTryout,
      totalUpcomingTryout,
      totalEndedTryout,
      totalUser,
      activeUser,
      totalAdmin,
    };
  }
}
