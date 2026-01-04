import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

  private mapTryoutToDto(tryout: any): TryoutDetailDto {
    const totalQuestions = tryout.subtests.reduce(
      (sum, s) => sum + s.questions.length,
      0,
    );

    const totalDuration = tryout.subtests.reduce(
      (sum, s) => sum + s.durationMinutes,
      0,
    );

    return {
      id: tryout.id, // CUID
      title: tryout.title,
      number: tryout.code,
      badge: tryout.batch, // SNBT / MANDIRI
      participants: tryout.attempts?.length ?? 0,
      description: tryout.description ?? '',
      duration: totalDuration,
      totalQuestions,
      startDate: tryout.scheduledStart?.toISOString() ?? '',
      endDate: '',
      isRegistered: (tryout.attempts?.length ?? 0) > 0,
      isFree: tryout.solutionPrice === 0,
      tokenCost: tryout.solutionPrice,
      categories: tryout.subtests.map((s) => ({
        id: Number(s.order),
        name: s.name,
        questionCount: s.questions.length,
        duration: s.durationMinutes,
        isCompleted: false,
      })),
      benefits: ['Pembahasan lengkap', 'Analisis hasil', 'Simulasi UTBK'],
      requirements: ['Akun terverifikasi', 'Token mencukupi'],
    };
  }

  async getTryouts(): Promise<TryOutCardDto[]> {
    const tryouts = await this.prisma.tryOut.findMany({
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    return tryouts.map((t) => ({
      id: t.id, // CUID
      title: t.title,
      number: t.code.toString(),
      canEdit: false,
      participants: t._count.attempts,
      badge: t.batch,
    }));
  }

  async getTryoutById(id: string, userId?: string): Promise<TryoutDetailDto> {
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id },
      include: {
        subtests: {
          include: {
            questions: true,
          },
        },
        attempts: userId ? { where: { userId } } : false,
        unlockedSolutions: userId ? { where: { userId } } : false,
      },
    });

    if (!tryout) {
      throw new Error('Tryout not found');
    }

    return this.mapTryoutToDto(tryout);
  }

  async getSubtestQuestions(tryOutId: string, subtestOrder: number) {
    const subtest = await this.prisma.subtest.findFirst({
      where: { tryOutId, order: subtestOrder },
      include: {
        tryOut: { select: { title: true } },
        questions: {
          include: { items: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!subtest) {
      throw new Error('Subtest not found');
    }

    return {
      subtestId: subtest.order,
      subtestName: subtest.name,
      tryoutId: tryOutId,
      tryoutTitle: subtest.tryOut.title,
      duration: subtest.durationMinutes,
      questions: subtest.questions.map((q) => ({
        id: q.id,
        questionText: q.content,
        options: q.items.map((i) => i.content),
        optionIds: q.items.map((i) => i.id),
      })),
    };
  }
}
