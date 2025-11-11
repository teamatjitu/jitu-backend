import { Injectable } from '@nestjs/common';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';
import { PrismaService } from 'src/prisma.service';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

  async create(createTryoutDto: CreateTryoutDto) {
    const { ...rest } = createTryoutDto;

    return this.prisma.tryout.create({
      data: {
        ...rest,
        id: randomUUID(),
        year: new Date().getUTCFullYear(),
        duration: 120,
        isClosed: false,
      },
    });
  }

  async findAll() {
    try {
      return await this.prisma.tryout.findMany();
    } catch (error) {
      return { message: 'no tryout created' };
    }
  }

  findOne(id: string) {
    return this.prisma.tryout.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateTryoutDto: UpdateTryoutDto) {
    try {
      return await this.prisma.tryout.update({
        where: { id },
        data: {
          ...updateTryoutDto,
        },
      });
    } catch (error) {
      return { message: error };
    }
  }

  remove(id: string) {
    return this.prisma.tryout.delete({
      where: { id },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async closeTryouts() {
    const now = new Date();

    const closedTryouts = await this.prisma.tryout.findMany({
      where: {
        closedAt: { lte: now },
        isClosed: false,
      },
    });

    for (const tryout of closedTryouts) {
      await this.prisma.tryout.update({
        where: { id: tryout.id },
        data: { isClosed: true },
      });
    }
  }
}
