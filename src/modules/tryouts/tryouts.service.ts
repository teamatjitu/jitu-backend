import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    // Check if tryout exists
    const tryout = await this.prisma.tryout.findUnique({
      where: { id: tryoutId },
      select: { isClosed: true },
    });

    if (!tryout) {
      throw new NotFoundException('Tryout not found');
    }

    if (tryout.isClosed) {
      throw new BadRequestException('Tryout is closed');
    }

    // Check if user already has an active attempt
    const existingAttempt = await this.prisma.tryoutAttempt.findFirst({
      where: {
        userId: userId,
        tryoutId: tryoutId,
        isFinished: false,
      },
    });

    if (existingAttempt) {
      throw new BadRequestException(
        'You already have an active attempt for this tryout',
      );
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

  async startSubtest(tryoutAttemptId: string, subtestId: string) {
    const tryoutAttempt = await this.prisma.tryoutAttempt.findUnique({
      where: { id: tryoutAttemptId },
      select: { tryoutId: true, isFinished: true },
    });

    if (!tryoutAttempt) {
      throw new NotFoundException('Tryout attempt not found');
    }

    if (tryoutAttempt.isFinished) {
      throw new BadRequestException('Tryout already finished');
    }

    const subtest = await this.prisma.subtest.findUnique({
      where: { id: subtestId },
    });

    if (!subtest) {
      throw new NotFoundException('Subtest not found');
    }

    // Validate subtest belongs to tryout
    if (subtest.tryoutId !== tryoutAttempt.tryoutId) {
      throw new BadRequestException('Subtest does not belong to this tryout');
    }

    // Check if subtest attempt already exists
    const existingAttempt = await this.prisma.subtestAttempt.findUnique({
      where: {
        attemptId_subtestId: {
          attemptId: tryoutAttemptId,
          subtestId: subtestId,
        },
      },
    });

    if (existingAttempt) {
      throw new BadRequestException('Subtest already started');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + subtest.duration * 60000);

    const subtestAttempt = await this.prisma.subtestAttempt.create({
      data: {
        attemptId: tryoutAttemptId,
        subtestId,
        startedAt: now,
        expiresAt: expiresAt,
      },
    });

    return subtestAttempt;
  }

  async getSubtestQuestions(subtestAttemptId: string) {
    const subtestAttempt = await this.prisma.subtestAttempt.findUnique({
      where: { id: subtestAttemptId },
      include: {
        attempt: {
          select: { isFinished: true },
        },
        subtest: {
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
        },
      },
    });

    if (!subtestAttempt) {
      throw new NotFoundException('Subtest attempt not found');
    }

    if (subtestAttempt.attempt.isFinished) {
      throw new BadRequestException('Tryout already finished');
    }

    // Check if the subtest has expired
    if (subtestAttempt.expiresAt && new Date() > subtestAttempt.expiresAt) {
      await this.finishSubtest(subtestAttemptId);
      throw new BadRequestException('Subtest has expired');
    }

    if (subtestAttempt.isFinished) {
      throw new BadRequestException('Subtest already finished');
    }

    return subtestAttempt.subtest;
  }

  async submitAnswer(
    tryoutAttemptId: string,
    subtestAttemptId: string,
    submitAnswerDto: SubmitAnswerDto,
  ) {
    // Validate tryout is not finished
    const tryoutAttempt = await this.prisma.tryoutAttempt.findUnique({
      where: { id: tryoutAttemptId },
      select: { isFinished: true },
    });

    if (!tryoutAttempt) {
      throw new NotFoundException('Tryout attempt not found');
    }

    if (tryoutAttempt.isFinished) {
      throw new BadRequestException('Tryout already finished');
    }

    // Validate subtest attempt
    const subtestAttempt = await this.prisma.subtestAttempt.findUnique({
      where: { id: subtestAttemptId },
      select: { isFinished: true, expiresAt: true },
    });

    if (!subtestAttempt) {
      throw new NotFoundException('Subtest attempt not found');
    }

    if (subtestAttempt.isFinished) {
      throw new BadRequestException('Subtest already finished');
    }

    // Check if subtest has expired
    if (subtestAttempt.expiresAt && new Date() > subtestAttempt.expiresAt) {
      await this.finishSubtest(subtestAttemptId);
      throw new BadRequestException('Subtest has expired');
    }

    const { soalId, jawaban } = submitAnswerDto;

    const soalAttempt = await this.prisma.soalAttempt.upsert({
      where: {
        subtestAttemptId_soalId: {
          subtestAttemptId: subtestAttemptId,
          soalId: soalId,
        },
      },
      update: {
        jawaban: jawaban,
      },
      create: {
        tryoutAttemptId,
        subtestAttemptId,
        soalId: soalId,
        jawaban: jawaban,
      },
    });

    return soalAttempt;
  }

  async finishSubtest(subtestAttemptId: string) {
    const subtestAttempt = await this.prisma.subtestAttempt.findUnique({
      where: { id: subtestAttemptId },
      include: {
        attempt: {
          select: {
            isFinished: true,
            id: true,
          },
        },
      },
    });

    if (!subtestAttempt) {
      throw new NotFoundException('Subtest attempt not found');
    }

    if (subtestAttempt.isFinished) {
      throw new BadRequestException('Subtest already finished');
    }

    if (subtestAttempt.attempt.isFinished) {
      throw new BadRequestException('Tryout already finished');
    }

    await this.prisma.subtestAttempt.update({
      where: { id: subtestAttemptId },
      data: {
        isFinished: true,
        finishedAt: new Date(),
      },
    });

    // Check if all subtests are finished and auto-finish tryout
    await this.checkAndFinishTryout(subtestAttempt.attempt.id);

    return {
      success: true,
      message: 'Subtest finished successfully',
    };
  }

  private async checkAndFinishTryout(tryoutAttemptId: string) {
    const tryoutAttempt = await this.prisma.tryoutAttempt.findUnique({
      where: { id: tryoutAttemptId },
      include: {
        subtestAttempt: {
          select: { isFinished: true },
        },
      },
    });

    if (!tryoutAttempt || tryoutAttempt.isFinished) {
      return;
    }

    // Check if all subtests are finished
    const allFinished = tryoutAttempt.subtestAttempt.every(
      (subtest) => subtest.isFinished === true,
    );

    if (allFinished && tryoutAttempt.subtestAttempt.length > 0) {
      await this.finishTryout(tryoutAttemptId);
    }
  }

  async finishTryout(tryoutAttemptId: string) {
    const tryoutAttempt = await this.prisma.tryoutAttempt.findUnique({
      where: { id: tryoutAttemptId },
      include: {
        subtestAttempt: {
          select: { isFinished: true, id: true },
        },
      },
    });

    if (!tryoutAttempt) {
      throw new NotFoundException('Tryout attempt not found');
    }

    if (tryoutAttempt.isFinished) {
      return {
        success: true,
        message: 'Tryout already finished',
        rawScore: tryoutAttempt.rawScore || 0,
      };
    }

    // Finish all unfinished subtests
    const unfinishedSubtests = tryoutAttempt.subtestAttempt.filter(
      (subtest) => !subtest.isFinished,
    );

    if (unfinishedSubtests.length > 0) {
      await this.prisma.subtestAttempt.updateMany({
        where: {
          id: { in: unfinishedSubtests.map((s) => s.id) },
        },
        data: {
          isFinished: true,
          finishedAt: new Date(),
        },
      });
    }

    // Calculate raw score
    const soalAttempts = await this.prisma.soalAttempt.findMany({
      where: { tryoutAttemptId: tryoutAttemptId },
      include: {
        soal: {
          include: {
            opsi: {
              where: { isCorrect: true },
              select: { id: true },
            },
          },
        },
      },
    });

    let totalCorrect = 0;
    const updatePromises: Prisma.PrismaPromise<any>[] = [];

    for (const attempt of soalAttempts) {
      const correctOptionId = attempt.soal.opsi[0]?.id;
      const isCorrect = attempt.jawaban === correctOptionId;

      if (isCorrect) {
        totalCorrect++;
      }

      updatePromises.push(
        this.prisma.soalAttempt.update({
          where: { id: attempt.id },
          data: { isCorrect: isCorrect },
        }),
      );
    }

    await this.prisma.$transaction(updatePromises);

    await this.prisma.tryoutAttempt.update({
      where: { id: tryoutAttemptId },
      data: {
        rawScore: totalCorrect,
        isFinished: true,
        finishedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Tryout finished successfully',
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
        isFinished: true,
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
      orderBy: [{ scaledScore: 'desc' }, { createdAt: 'asc' }],
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

  async getRemainingTime(subtestAttemptId: string) {
    const subtestAttempt = await this.prisma.subtestAttempt.findUnique({
      where: { id: subtestAttemptId },
      select: { expiresAt: true, isFinished: true },
    });

    if (!subtestAttempt) {
      throw new NotFoundException('Subtest attempt not found');
    }

    const { expiresAt, isFinished } = subtestAttempt;

    if (isFinished) {
      return { remainingTime: 0 };
    }

    const now = new Date();

    // Check subtest expiration
    if (expiresAt && now > expiresAt) {
      await this.finishSubtest(subtestAttemptId);
      return { remainingTime: 0 };
    }

    const remainingTime = Math.max(0, expiresAt!.getTime() - now.getTime());

    return {
      remainingTime: Math.floor(remainingTime / 1000),
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
    const attemptScores: { id: string; score: number }[] = [];

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

  async getSubtestAttemptDetails(subtestAttemptId: string) {
    const subtestAttempt = await this.prisma.subtestAttempt.findUnique({
      where: { id: subtestAttemptId },
      include: {
        subtest: {
          include: {
            soal: {
              include: {
                opsi: true,
                pembahasanSoal: true,
              },
            },
          },
        },
        soalAttempt: {
          include: {
            soal: true,
          },
        },
      },
    });

    if (!subtestAttempt) {
      throw new NotFoundException('Subtest attempt not found');
    }

    return subtestAttempt;
  }
}
