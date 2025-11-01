import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Prisma } from 'generated/prisma/client';
import { PaginationDto } from './dto/pagination.dto';

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

    const finishedAttempt = await this.prisma.tryoutAttempt.update({
      where: { id: attemptId },
      data: {
        rawScore: totalCorrect,
        isFinished: true,
      },
    });

    return {
      message: 'Tryout finished. Scoring in progress.',
      attemptId: finishedAttempt.id,
      rawScore: totalCorrect,
    };
  }

  async getTryoutHistory(userId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const totalAttempts = await this.prisma.tryoutAttempt.count({
      where: { userId: userId },
    });

    const attempts = await this.prisma.tryoutAttempt.findMany({
      where: { userId: userId },
      include: {
        tryout: {
          select: { name: true, year: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skip,
      take: limit,
    });

    const results = attempts.map((attempt) => ({
      attemptId: attempt.id,
      tryoutName: attempt.tryout.name,
      tryoutYear: attempt.tryout.year,
      submittedAt: attempt.createdAt,
      rawScore: attempt.rawScore,
      scaledScore: attempt.scaledScore,
      isFinished: attempt.isFinished,
    }));

    return {
      data: results,
      totalPages: Math.ceil(totalAttempts / limit),
      currentPage: page,
    };
  }
  
  async getLeaderboard(tryoutId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const totalAttempts = await this.prisma.tryoutAttempt.count({
      where: { 
        tryoutId: tryoutId,
        isFinished: true 
      },
    });

    const attempts = await this.prisma.tryoutAttempt.findMany({
      where: {
        tryoutId: tryoutId,
        isFinished: true,
      },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: [
        { scaledScore: 'desc' },
        { createdAt: 'asc' }, 
      ],
      skip: skip,
      take: limit,
    });

    const leaderboardEntries = attempts.map((attempt, index) => ({
      rank: skip + index + 1,
      userId: attempt.userId,
      userName: attempt.user.name,
      userImage: attempt.user.image,
      score: attempt.scaledScore || 0,
      submittedAt: attempt.createdAt,
    }));

    return {
      data: leaderboardEntries,
      totalPages: Math.ceil(totalAttempts / limit),
      currentPage: page,
    };
  }

  async calculateScaledScores(tryoutId: string) {
    const soalBobot = await this.getSoalWeights(tryoutId);

    const attempts = await this.prisma.tryoutAttempt.findMany({
      where: {
        tryoutId: tryoutId,
        isFinished: true,
      },
      include: {
        soalAttempt: true,
      },
    });

    if (attempts.length === 0) {
      return { message: 'No finished attempts to score.' };
    }

    let minWeightedScore = Infinity;
    let maxWeightedScore = -Infinity;
    const attemptScores: any[] = [];

    for (const attempt of attempts) {
      let weightedScore = 0;
      for (const soal of attempt.soalAttempt) {
        if (soal.isCorrect === true) {
          weightedScore += soalBobot[soal.soalId] || 0;
        }
      }
      
      attemptScores.push({ id: attempt.id, score: weightedScore });
      if (weightedScore < minWeightedScore) minWeightedScore = weightedScore;
      if (weightedScore > maxWeightedScore) maxWeightedScore = weightedScore;
    }

    const updatePromises: Prisma.PrismaPromise<any>[] = [];
    const scale = maxWeightedScore - minWeightedScore;

    for (const attempt of attemptScores) {
      let scaledScore = 200;
      if (scale > 0) {
        scaledScore += ((attempt.score - minWeightedScore) / scale) * 600;
      }
      
      const finalScore = Math.round(scaledScore);

      updatePromises.push(
        this.prisma.tryoutAttempt.update({
          where: { id: attempt.id },
          data: { scaledScore: finalScore },
        }),
      );
    }
    
    await this.prisma.$transaction(updatePromises);

    return {
      message: `Scoring complete for ${attempts.length} users.`,
      minScore: minWeightedScore,
      maxScore: maxWeightedScore,
    };
  }

  private async getSoalWeights(tryoutId: string) {
    const soals = await this.prisma.soal.findMany({
      where: { tryoutId: tryoutId },
      select: { id: true },
    });

    const soalWeights = {};

    for (const soal of soals) {
      const totalAttempts = await this.prisma.soalAttempt.count({
        where: { soalId: soal.id },
      });
      
      if (totalAttempts === 0) {
        soalWeights[soal.id] = 1;
        continue;
      }

      const correctAttempts = await this.prisma.soalAttempt.count({
        where: {
          soalId: soal.id,
          isCorrect: true,
        },
      });

      const correctRatio = correctAttempts / totalAttempts;
      
      soalWeights[soal.id] = 1 - correctRatio;
    }
    
    return soalWeights;
  }



}