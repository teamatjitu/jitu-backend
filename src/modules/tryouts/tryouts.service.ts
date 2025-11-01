import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class TryoutsService {
  constructor(private prisma: PrismaService) {}

  async startTryout(userId: string, tryoutId: string) {
    const account = await this.prisma.account.findFirst({
      where: { userId: userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found for this user');
    }

    const tryoutAttempt = await this.prisma.tryoutAttempt.create({
      data: {
        tryoutId: tryoutId,
        userId: userId,
        accountId: account.id,
      },
    });

    return tryoutAttempt;
  }

  async getTryoutQuestions(attemptId: string) {
    const tryoutAttempt = await this.prisma.tryoutAttempt.findUnique({
      where: { id: attemptId },
      select: { tryoutId: true },
    });

    if (!tryoutAttempt) {
      throw new NotFoundException('Tryout attempt not found');
    }

    const tryoutWithSoal = await this.prisma.tryout.findUnique({
      where: { id: tryoutAttempt.tryoutId },
      include: {
        soal: {
          include: {
            opsi: {
              select: {
                id: true,
                teks: true,
              },
            },
          },
        },
      },
    });

    if (!tryoutWithSoal) {
      throw new NotFoundException('Tryout data not found');
    }

    return tryoutWithSoal;
  }

  async submitAnswer(
    attemptId: string,
    submitAnswerDto: SubmitAnswerDto,
  ) {
    const { soalId, jawaban } = submitAnswerDto;

    const soalAttempt = await this.prisma.soalAttempt.upsert({
      where: {
        tryoutAttemptId_soalId: {
          tryoutAttemptId: attemptId,
          soalId: soalId,
        },
      },
      update: {
        jawaban: jawaban,
      },
      create: {
        tryoutAttemptId: attemptId,
        soalId: soalId,
        jawaban: jawaban,
      },
    });

    return soalAttempt;
  }

async finishTryout(attemptId: string) {
    const soalAttempts = await this.prisma.soalAttempt.findMany({
      where: { tryoutAttemptId: attemptId },
    });

    if (soalAttempts.length === 0) {
      return {
        message: 'No answers submitted for this attempt.',
        totalCorrect: 0,
        totalQuestions: 0,
      };
    }

    const soalIds = soalAttempts.map((attempt) => attempt.soalId);

    const correctOptions = await this.prisma.opsi.findMany({
      where: {
        soalId: { in: soalIds },
        isCorrect: true,
      },
      select: {
        id: true,
      },
    });

    const correctOptionIds = new Set(
      correctOptions.map((option) => option.id),
    );

    let totalCorrect = 0;
    const updatePromises: Prisma.PrismaPromise<any>[] = [];

    for (const attempt of soalAttempts) {
      let isCorrect = false;
      if (attempt.jawaban) {
        isCorrect = correctOptionIds.has(attempt.jawaban);
      }
      
      if (isCorrect) {
        totalCorrect++;
      }

      const updatePromise = this.prisma.soalAttempt.update({
        where: { id: attempt.id },
        data: { isCorrect: isCorrect },
      });
      updatePromises.push(updatePromise);
    }

    await this.prisma.$transaction(updatePromises);

    return {
      message: 'Scoring complete.',
      totalCorrect: totalCorrect,
      totalQuestions: soalAttempts.length,
    };
  }

  async getTryoutHistory(userId: string) {
    const attempts = await this.prisma.tryoutAttempt.findMany({
      where: { userId: userId },
      include: {
        tryout: {
          select: { name: true, year: true },
        },
        _count: {
          select: {
            soalAttempt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const results: any[] = [];

    for (const attempt of attempts) {
      const correctCount = await this.prisma.soalAttempt.count({
        where: {
          tryoutAttemptId: attempt.id,
          isCorrect: true,
        },
      });

      results.push({
        attemptId: attempt.id,
        tryoutName: attempt.tryout.name,
        tryoutYear: attempt.tryout.year,
        submittedAt: attempt.createdAt,
        totalQuestions: attempt._count.soalAttempt,
        totalCorrect: correctCount,
      });
    }

    return results;
  }
  
}