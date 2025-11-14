import { Injectable } from '@nestjs/common';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';
import { CreateUtbkTryoutDto } from './dto/create-utbk-tryout.dto';
import { PrismaService } from '@/prisma.service';
import { randomUUID } from 'crypto';
import { UTBK_SUBTEST_CONFIGS } from './dto/subtest-config.dto';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

  async createUTBKTryout(createUtbkTryoutDto: CreateUtbkTryoutDto) {
    const {
      name,
      year,
      publishedAt,
      closedAt,
      isClosed,
      subtestCustomizations,
    } = createUtbkTryoutDto;

    // Default dates if not provided
    const defaultPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
    const defaultClosedAt = closedAt
      ? new Date(closedAt)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Create a map of customizations by type for easy lookup
    const customizationMap = new Map(
      (subtestCustomizations || []).map((custom) => [custom.type, custom]),
    );

    // Create tryout with all UTBK subtests in a transaction
    const tryout = await this.prisma.$transaction(async (tx) => {
      // Create the tryout
      const newTryout = await tx.tryout.create({
        data: {
          name,
          year,
          publishedAt: defaultPublishedAt,
          closedAt: defaultClosedAt,
          isClosed: isClosed ?? false,
        },
      });

      // Create all 7 UTBK subtests with customizations if provided
      const subtests = await Promise.all(
        UTBK_SUBTEST_CONFIGS.map((config) => {
          const customization = customizationMap.get(config.type);

          return tx.subtest.create({
            data: {
              name: config.name,
              type: config.type,
              kategori: config.kategori,
              duration: customization?.duration ?? config.duration,
              questionCount:
                customization?.questionCount ?? config.defaultQuestionCount,
              tryoutId: newTryout.id,
            },
          });
        }),
      );

      return {
        ...newTryout,
        subtest: subtests,
      };
    });

    return {
      success: true,
      message: 'UTBK tryout created successfully with all 7 subtests',
      data: tryout,
    };
  }

  async create(createTryoutDto: CreateTryoutDto) {
    const { ...rest } = createTryoutDto;

    return this.prisma.tryout.create({
      data: {
        ...rest,
        id: randomUUID(),
        isClosed: false,
        publishedAt: new Date(),
        closedAt: new Date(),
      },
    });
  }

  async findAll() {
    try {
      return await this.prisma.tryout.findMany({
        include: {
          subtest: {
            select: {
              id: true,
              name: true,
              type: true,
              kategori: true,
              duration: true,
            },
            orderBy: [{ kategori: 'asc' }, { type: 'asc' }],
          },
          _count: {
            select: {
              tryoutAttempt: true,
              soal: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      return { message: 'no tryout created' };
    }
  }

  async findOne(id: string) {
    return this.prisma.tryout.findUnique({
      where: { id },
      include: {
        subtest: {
          select: {
            id: true,
            name: true,
            type: true,
            kategori: true,
            duration: true,
            questionCount: true,
            _count: {
              select: {
                soal: true,
              },
            },
          },
          orderBy: [{ kategori: 'asc' }, { type: 'asc' }],
        },
        _count: {
          select: {
            tryoutAttempt: true,
            soal: true,
          },
        },
      },
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
    } catch {
      return { message: 'Id Not Found' };
    }
  }

  remove(id: string) {
    return this.prisma.tryout.delete({
      where: { id },
    });
  }
}
