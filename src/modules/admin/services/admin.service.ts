import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateTryoutDto } from '../dto/create-tryout.dto';
import { UpdateTryoutDto } from '../dto/update-tryout.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const totalTryout = await this.prisma.tryOut.count();
    const totalActiveTryout = await this.prisma.tryOut.count({
      where: { scheduledStart: { lte: new Date() } },
    });
    const totalUpcomingTryout = await this.prisma.tryOut.count({
      where: { scheduledStart: { gt: new Date() } },
    });

    return { totalTryout, totalActiveTryout, totalUpcomingTryout };
  }
}
