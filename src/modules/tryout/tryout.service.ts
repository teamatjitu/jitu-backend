import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TryOutCardDto } from './dto/tryout.dto';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

  //   async getTryouts(): Promise<TryOutCardDto[]> {
  //     const tryouts = await this.prisma.tryOut.findMany({
  //       include: {
  //         _count: {
  //           select: { attempts: true },
  //         },
  //       },
  //     });

  //     return tryouts.map((t) => ({
  //       id: parseInt(t.id),
  //       title: t.title,
  //       number: t.id,
  //       canEdit: false,
  //       participants: t._count.attempts,
  //       badge: 'SNBT',
  //     }));
  //   }
}
