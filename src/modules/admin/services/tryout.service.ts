import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateTryoutDto } from '../dto/create-tryout.dto';
import { UpdateTryoutDto } from '../dto/update-tryout.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AdminTryoutService {
  constructor(private readonly prisma: PrismaService) {}

  async getTryouts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tryOut.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Changed to desc for newest first
        select: {
          id: true,
          code: true,
          title: true,
          solutionPrice: true,
          releaseDate: true,
          status: true,
        },
      }),
      this.prisma.tryOut.count(),
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

  async getTryoutById(id: string) {
    return this.prisma.tryOut.findUnique({
      where: { id },
    });
  }

  async createTryout(dto: CreateTryoutDto) {
    const scheduledDate = new Date(dto.scheduledStart);
    const now = new Date();

    let status: 'NOT_STARTED' | 'IN_PROGRESS' = 'NOT_STARTED';
    if (scheduledDate <= now) {
      status = 'IN_PROGRESS';
    }

    return await this.prisma.tryOut.create({
      data: {
        title: dto.title,
        description: dto.description,
        solutionPrice: dto.solutionPrice,
        batch: dto.batch,
        releaseDate: new Date(dto.releaseDate),
        scheduledEnd: new Date(dto.scheduledEnd),
        scheduledStart: scheduledDate,
        status: status,
      },

      select: {
        id: true,
        code: true,
        title: true,
        scheduledStart: true,
        releaseDate: true,
        scheduledEnd: true,
        createdAt: true,
      },
    });
  }

  async updateTryout(id: string, dto: UpdateTryoutDto) {
    const existingTryout = await this.prisma.tryOut.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTryout) {
      throw new NotFoundException('Tryout tidak ditemukan');
    }

    return await this.prisma.tryOut.update({
      where: { id },
      data: {
        title: dto.title,
        solutionPrice: dto.solutionPrice,
        scheduledStart: dto.scheduledStart && new Date(dto.scheduledStart),
        scheduledEnd: dto.scheduledEnd && new Date(dto.scheduledEnd),
        releaseDate: dto.releaseDate && new Date(dto.releaseDate),
        description: dto.description,
      },
      select: {
        id: true,
        code: true,
        title: true,
        scheduledStart: true,
        releaseDate: true,
        scheduledEnd: true,
        createdAt: true,
      },
    });
  }

  async deleteTryout(id: string) {
    const existingTryout = await this.prisma.tryOut.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTryout) {
      throw new NotFoundException('Tryout tidak ditemukan');
    }

    return await this.prisma.tryOut.delete({
      where: { id },
      select: {
        id: true,
        title: true,
      },
    });
  }
}
