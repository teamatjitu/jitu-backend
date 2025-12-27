import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { UserStatsDto } from './dto/dashboard.dto';

enum TryoutStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || '',
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

    const [lastAttempt, bestScore, weeklyActivity, totalFinished] =
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
      ]);

    return {
      lastScore: lastAttempt?.totalScore
        ? Math.round(lastAttempt.totalScore)
        : 0,
      personalBest: bestScore._max.totalScore
        ? Math.round(bestScore._max.totalScore)
        : 0,
      weeklyActivity: weeklyActivity,
      totalFinished: totalFinished,
    };
  }
}
