import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSoalDto } from './dto/create-soal.dto';
import { UpdateSoalDto } from './dto/update-soal.dto';
import { PrismaService } from '@/prisma.service';
import { SUBTEST_TYPE } from 'generated/prisma/client';

@Injectable()
export class SoalService {
  constructor(private prisma: PrismaService) {}

  async create(createSoalDto: CreateSoalDto) {
    const { tryoutId, subtestType, opsi, pembahasanSoal, tipeSoal, question } =
      createSoalDto;

    // Find subtest by tryoutId and type
    const subtest = await this.prisma.subtest.findFirst({
      where: {
        tryoutId: tryoutId,
        type: subtestType as SUBTEST_TYPE,
      },
    });

    if (!subtest) {
      throw new NotFoundException(
        `Subtest with type ${subtestType} not found for tryout ${tryoutId}`,
      );
    }

    // Create soal with opsi and pembahasan
    const soal = await this.prisma.soal.create({
      data: {
        tipeSoal,
        question,
        tryoutId: tryoutId,
        subtestId: subtest.id,
        opsi: opsi
          ? {
              create: opsi,
            }
          : undefined,
        pembahasanSoal: pembahasanSoal
          ? {
              create: pembahasanSoal,
            }
          : undefined,
      },
      include: {
        opsi: true,
        pembahasanSoal: true,
      },
    });

    return soal;
  }

  async findByTryoutAndSubtest(tryoutId: string, subtestType: string) {
    // Find subtest by tryoutId and type
    const subtest = await this.prisma.subtest.findFirst({
      where: {
        tryoutId: tryoutId,
        type: subtestType as SUBTEST_TYPE,
      },
    });

    if (!subtest) {
      throw new NotFoundException(
        `Subtest with type ${subtestType} not found for tryout ${tryoutId}`,
      );
    }

    // Get all soal for this subtest
    const soal = await this.prisma.soal.findMany({
      where: {
        tryoutId: tryoutId,
        subtestId: subtest.id,
      },
      include: {
        opsi: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        pembahasanSoal: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      subtest: {
        id: subtest.id,
        name: subtest.name,
        type: subtest.type,
        kategori: subtest.kategori,
        duration: subtest.duration,
        questionCount: subtest.questionCount,
      },
      soal: soal,
      total: soal.length,
    };
  }

  async findOne(id: string) {
    const soal = await this.prisma.soal.findUnique({
      where: { id },
      include: {
        opsi: true,
        pembahasanSoal: true,
      },
    });

    if (!soal) {
      throw new NotFoundException(`Soal with ID ${id} not found`);
    }

    return soal;
  }

  async update(id: string, updateSoalDto: UpdateSoalDto) {
    const { opsi, pembahasanSoal, subtestType, tipeSoal, question } = updateSoalDto;

    // Check if soal exists
    const existingSoal = await this.prisma.soal.findUnique({
      where: { id },
      include: {
        opsi: true,
        pembahasanSoal: true,
      },
    });

    if (!existingSoal) {
      throw new NotFoundException(`Soal with ID ${id} not found`);
    }

    // If subtestType is provided, find the new subtest
    let subtestId = existingSoal.subtestId;
    if (subtestType) {
      const subtest = await this.prisma.subtest.findFirst({
        where: {
          tryoutId: existingSoal.tryoutId,
          type: subtestType as SUBTEST_TYPE,
        },
      });

      if (!subtest) {
        throw new NotFoundException(
          `Subtest with type ${subtestType} not found`,
        );
      }
      subtestId = subtest.id;
    }

    // Update soal in transaction
    const updatedSoal = await this.prisma.$transaction(async (tx) => {
      // Delete existing opsi if new ones are provided
      if (opsi) {
        await tx.opsi.deleteMany({
          where: { soalId: id },
        });
      }

      // Update soal
      const soal = await tx.soal.update({
        where: { id },
        data: {
          ...(tipeSoal && { tipeSoal }),
          ...(question && { question }),
          subtestId: subtestId,
          opsi: opsi
            ? {
                create: opsi,
              }
            : undefined,
          pembahasanSoal: pembahasanSoal
            ? existingSoal.pembahasanSoal
              ? {
                  update: pembahasanSoal,
                }
              : {
                  create: pembahasanSoal,
                }
            : undefined,
        },
        include: {
          opsi: true,
          pembahasanSoal: true,
        },
      });

      return soal;
    });

    return updatedSoal;
  }

  async remove(id: string) {
    const soal = await this.prisma.soal.findUnique({
      where: { id },
    });

    if (!soal) {
      throw new NotFoundException(`Soal with ID ${id} not found`);
    }

    await this.prisma.soal.delete({
      where: { id },
    });

    return { message: 'Soal deleted successfully' };
  }
}
