import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import {
  UserStatsDto,
  OngoingTryoutDto,
  AvailableTryoutDto,
  ScoreHistoryDto,
} from './dto/dashboard.dto';

import { isISO4217CurrencyCode } from 'class-validator';

enum TryoutStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jitu-profile-pictures',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result || !result.secure_url) {
            return reject(
              new Error('Gagal mengupload gambar ke Cloudinary: Result kosong'),
            );
          }
          resolve(result.secure_url);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async getProfile(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        target: true,
        tokenBalance: true,
        currentStreak: true,
        lastDailyDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    payload: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const updateData: any = { ...payload };

    if (file) {
      try {
        const imageUrl = await this.uploadToCloudinary(file);
        updateData.image = imageUrl;
      } catch (error) {
        throw new BadRequestException('Gagal mengupload gambar ke Cloudinary');
      }
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        target: true,
        updatedAt: true,
      },
    });
  }

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const now = new Date();
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

    const [lastAttempt, bestScore, weeklyActivity, totalFinished, user] =
      await Promise.all([
        // last tryout score
        this.prisma.tryOutAttempt.findFirst({
          where: { userId, status: TryoutStatus.FINISHED },
          orderBy: { finishedAt: 'desc' },
          select: { totalScore: true },
        }),

        // best score
        this.prisma.tryOutAttempt.aggregate({
          where: { userId, status: TryoutStatus.FINISHED },
          _max: { totalScore: true },
        }),

        //weekly activity
        this.prisma.tryOutAttempt.count({
          where: {
            userId,
            startedAt: { gte: oneWeekAgo },
          },
        }),

        // totalFinished
        this.prisma.tryOutAttempt.count({
          where: { userId, status: TryoutStatus.FINISHED },
        }),

        // user data for token balance and streak
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { tokenBalance: true, currentStreak: true },
        }),
      ]);

    return {
      tokenBalance: user?.tokenBalance || 0,
      lastScore: lastAttempt?.totalScore
        ? Math.round(lastAttempt.totalScore)
        : 0,
      personalBest: bestScore._max.totalScore
        ? Math.round(bestScore._max.totalScore)
        : 0,
      weeklyActivity: weeklyActivity,
      completedTryouts: totalFinished,
      currentStreak: user?.currentStreak || 0,
    };
  }

  async getScoreHistory(userId: string): Promise<ScoreHistoryDto[]> {
    const attempts = await this.prisma.tryOutAttempt.findMany({
      where: {
        userId,
        status: 'FINISHED',
      },
      orderBy: {
        finishedAt: 'asc',
      },
      include: {
        tryOut: {
          select: {
            code: true,
            title: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                points: true,
                subtest: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return attempts.map((attempt) => {
      const scores = {
        pu: 0,
        ppu: 0,
        pbm: 0,
        pk: 0,
        literasiIndo: 0,
        literasiEng: 0,
      };

      attempt.answers.forEach((answer) => {
        if (answer.isCorrect) {
          const subtestName = answer.question.subtest.name;
          const points = answer.question.points;

          if (subtestName === 'PU') scores.pu += points;
          if (subtestName === 'PPU') scores.ppu += points;
          if (subtestName === 'PBM') scores.pbm += points;
          if (subtestName === 'PK') scores.pk += points;
          if (subtestName === 'LBI') scores.literasiIndo += points;
          if (subtestName === 'LBE') scores.literasiEng += points;
        }
      });

      return {
        to: attempt.id,
        tryOutTitle: attempt.tryOut.title,
        total: Math.round(attempt.totalScore),
        ...scores,
      };
    });
  }

  async getOngoingTryouts(userId: string): Promise<OngoingTryoutDto[]> {
    // Get user's in-progress attempts
    const userAttempts = await this.prisma.tryOutAttempt.findMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      select: {
        tryOutId: true,
      },
    });

    const tryoutIds = userAttempts.map((attempt) => attempt.tryOutId);

    if (tryoutIds.length === 0) {
      return [];
    }

    const tryouts = await this.prisma.tryOut.findMany({
      where: {
        id: { in: tryoutIds },
      },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    return tryouts.map((tryout) => ({
      id: tryout.id,
      title: tryout.title,
      description: tryout.description,
      solutionPrice: tryout.solutionPrice,
      isPublic: tryout.isPublic,
      scheduledStart: tryout.scheduledStart,
      createdAt: tryout.createdAt,
      participants: tryout._count.attempts,
      isRegistered: true,
    }));
  }

  async getAvailableTryouts(userId: string): Promise<AvailableTryoutDto[]> {
    // Get tryouts that are public and not yet started by the user
    const userAttempts = await this.prisma.tryOutAttempt.findMany({
      where: { userId },
      select: { tryOutId: true },
    });

    const attemptedTryoutIds = userAttempts.map((attempt) => attempt.tryOutId);

    const tryouts = await this.prisma.tryOut.findMany({
      where: {
        isPublic: true,
        id: { notIn: attemptedTryoutIds },
      },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tryouts.map((tryout) => ({
      id: tryout.id,
      title: tryout.title,
      description: tryout.description,
      solutionPrice: tryout.solutionPrice,
      isPublic: tryout.isPublic,
      scheduledStart: tryout.scheduledStart,
      createdAt: tryout.createdAt,
      participants: tryout._count.attempts,
    }));
  }
}
