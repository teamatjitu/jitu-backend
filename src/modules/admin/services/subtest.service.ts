import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateSubtestDto } from '../dto/create-subtest.dto';
import { SubtestName } from 'generated/prisma/enums';

@Injectable()
export class AdminSubtestService {
  constructor(private readonly prisma: PrismaService) {}

  async initStandardSubtests(tryOutId: string) {
    // assign subtest by default (kalau nambah test mandiri harus diubah)
    const utbkSubtests = [
      { name: SubtestName.PU, duration: 30, order: 1 },
      { name: SubtestName.PPU, duration: 15, order: 2 },
      { name: SubtestName.PBM, duration: 25, order: 3 },
      { name: SubtestName.PK, duration: 20, order: 4 },
      { name: SubtestName.LBI, duration: 45, order: 5 },
      { name: SubtestName.LBE, duration: 30, order: 6 },
      { name: SubtestName.PM, duration: 45, order: 7 },
    ];

    const data = utbkSubtests.map((s) => ({
      tryOutId,
      name: s.name,
      durationMinutes: s.duration,
      order: s.order,
    }));

    return await this.prisma.subtest.createMany({
      data: data,
    });
  }

  async createSubtest(dto: CreateSubtestDto) {
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id: dto.tryoutId },
    });

    if (!tryout) throw new NotFoundException('Tryout Not Found');

    return await this.prisma.subtest.create({
      data: {
        tryOutId: dto.tryoutId,
        name: dto.name,
        durationMinutes: dto.durationMinutes,
        order: dto.order,
      },
    });
  }

  async getSubtestsByTryoutId(tryoutId: string) {
    const tryout = await this.prisma.tryOut.findUnique({
      where: { id: tryoutId },
    });

    if (!tryout) throw new NotFoundException('Tryout Not Found');

    return await this.prisma.subtest.findMany({
      where: { tryOutId: tryoutId },
      orderBy: { order: 'asc' },
    });
  }

  async deleteSubtest(id: string) {
    const existingSubtest = await this.prisma.subtest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingSubtest) throw new NotFoundException('Subtest Not Found');

    return await this.prisma.subtest.delete({
      where: { id },
    });
  }

  async getSubtestById(id: string) {
    const subtest = await this.prisma.subtest.findUnique({
      where: { id },
      include: {
        select: { id: true, name: true, durationMinutes: true },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!subtest) throw new NotFoundException('Subtest Not Found');

    return subtest;
  }
}
