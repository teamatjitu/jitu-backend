import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { TopupTokenDto } from '../dto/topup-token.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async manualTokenAdjustment(userId: string, dto: TopupTokenDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: dto.amount,
          type: 'MANUAL_ADJUSTMENT',
          referenceId: `ADMIN: ${dto.description}`,
        },
      });

      return await tx.user.update({
        where: { id: userId },
        data: {
          tokenBalance: { increment: dto.amount },
        },
      });
    });
  }

  async getAllUser(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          tokenBalance: true,
          target: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        tokenBalance: true,
        target: true,
        createdAt: true,
      },
    });
  }

  async getUserTransactions(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tokenTransaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tokenTransaction.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async getUserTryouts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tryOutAttempt.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          tryOut: {
            select: { title: true },
          },
        },
      }),
      this.prisma.tryOutAttempt.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async resetUserTryoutAttempt(attemptId: string) {
    const attempt = await this.prisma.tryOutAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Data pengerjaan tryout tidak ditemukan');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Hapus semua jawaban user terkait attempt ini
      await tx.userAnswer.deleteMany({
        where: { tryOutAttemptId: attemptId },
      });

      // Hapus data attempt
      return await tx.tryOutAttempt.delete({
        where: { id: attemptId },
      });
    });
  }

  async updateUser(dto: UpdateUserDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Password if provided
      if (dto.password) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        // Better-auth usually stores password in Account table
        // We update the primary account (or any password account)
        await tx.account.updateMany({
          where: { userId: userId, providerId: 'credential' }, // Assuming credential provider
          data: { password: hashedPassword },
        });
      }

      // 2. Update User data
      return await tx.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          role: dto.role,
          image: dto.image,
          tokenBalance: dto.tokenBalance,
        },
      });
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
