import { Injectable } from '@nestjs/common';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';
import { PrismaService } from '@/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TryoutService {
  constructor(private prisma: PrismaService) {}

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
      return { message: 'Id Not Found' };
    }
  }

  remove(id: string) {
    return this.prisma.tryout.delete({
      where: { id },
    });
  }
}
