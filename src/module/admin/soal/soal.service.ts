import { Injectable } from '@nestjs/common';
import { CreateSoalDto } from './dto/create-soal.dto';
import { UpdateSoalDto } from './dto/update-soal.dto';
import { CreatePembahasanDto } from './dto/create-pembahasan.dto';
import { PrismaService } from 'src/prisma.service';
import { randomUUID } from 'crypto';
import { SUBTEST } from 'generated/prisma';

@Injectable()
export class SoalService {
  constructor(private prisma: PrismaService) {}

  create(createSoalDto: CreateSoalDto) {
    const { pembahasan, opsi, ...rest } = createSoalDto;

    return this.prisma.soal.create({
      data: {
        ...rest,
        id: randomUUID(),
        opsi: opsi?.length
          ? {
              create: opsi.map((o) => ({
                ...o,
                id: randomUUID(),
              })),
            }
          : undefined,
        pembahasanSoal: pembahasan
          ? {
              create: { id: randomUUID(), pembahasan: pembahasan.pembahasan },
            }
          : undefined,
      },
    });
  }

  async findAll() {
    return await this.prisma.soal.findMany();
  }

  async findByTryoutAndSubtest(tryoutId: string, subtestType: string) {
    return await this.prisma.soal.findMany({
      where: {
        tryoutId,
        subtestType: subtestType as any,
      },
      include: {
        opsi: true,
        pembahasanSoal: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.soal.findUnique({
      where: { id },
    });
  }

  update(id: string, updateSoalDto: UpdateSoalDto) {
    const { opsi, pembahasan, ...rest } = updateSoalDto;
    return this.prisma.soal.update({
      where: { id },
      data: {
        ...rest,
        ...(opsi?.length && {
          opsi: {
            deleteMany: {},
            create: opsi.map((o) => ({ ...o, id: randomUUID() })),
          },
        }),
        ...(pembahasan && {
          pembahasanSoal: {
            upsert: {
              create: { id: randomUUID(), pembahasan: pembahasan.pembahasan },
              update: { pembahasan: pembahasan.pembahasan },
            },
          },
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.soal.delete({
      where: { id },
    });
  }
}
