import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TryOutCardDto } from './dto/tryout.dto';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

  // Mock data - replace with database queries when schema is ready
  private mockTryouts: TryOutCardDto[] = [
    {
      id: '5',
      title: 'Try Out UTBK SNBT 5 2026',
      number: '5',
      canEdit: false,
      participants: 8016,
      badge: 'SNBT',
    },
    {
      id: '4',
      title: 'Try Out UTBK SNBT 4 2026',
      number: '4',
      canEdit: false,
      participants: 22665,
      badge: 'SNBT',
    },
    {
      id: '3',
      title: 'Try Out UTBK SNBT 3 2026',
      number: '3',
      canEdit: false,
      participants: 18540,
      badge: 'SNBT',
    },
    {
      id: '2',
      title: 'Try Out UTBK SNBT 2 2026',
      number: '2',
      canEdit: false,
      participants: 22195,
      badge: 'SNBT',
    },
    {
      id: '1',
      title: 'Try Out UTBK SNBT 1 2026',
      number: '1',
      canEdit: false,
      participants: 31316,
      badge: 'SNBT',
    },
    {
      id: '14',
      title: 'Try Out UTBK SNBT 14 2025',
      number: '14',
      canEdit: false,
      participants: 188663,
      badge: 'SNBT',
    },
    {
      id: '13',
      title: 'Try Out UTBK SNBT 13 2025',
      number: '13',
      canEdit: false,
      participants: 156594,
      badge: 'SNBT',
    },
  ];

  async getActiveTryouts(): Promise<TryOutCardDto[]> {
    // For now, return the first item as active
    return [this.mockTryouts[0]];
    
    // TODO: When database is ready, implement:
    // const today = new Date();
    // return this.prisma.tryOut.findMany({
    //   where: {
    //     AND: [
    //       { scheduledStart: { lte: today } },
    //       { NOT: { scheduledStart: null } },
    //     ],
    //   },
    // });
  }

  async getAvailableTryouts(): Promise<TryOutCardDto[]> {
    // Return all except the first one (which is active)
    return this.mockTryouts.slice(1);
    
    // TODO: When database is ready, implement:
    // return this.prisma.tryOut.findMany({
    //   where: {
    //     OR: [
    //       { scheduledStart: null },
    //       { scheduledStart: { gt: new Date() } },
    //     ],
    //   },
    // });
  }

  async getTryouts(): Promise<TryOutCardDto[]> {
    return this.mockTryouts;
    
    // TODO: When database is ready, implement:
    // const tryouts = await this.prisma.tryOut.findMany({
    //   include: {
    //     _count: {
    //       select: { attempts: true },
    //     },
    //   },
    // });
    //
    // return tryouts.map((t) => ({
    //   id: t.id,
    //   title: t.title,
    //   number: t.id,
    //   canEdit: false,
    //   participants: t._count.attempts,
    //   badge: 'SNBT',
    // }));
  }
}
