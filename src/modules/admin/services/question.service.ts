import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { QuestionType } from 'generated/prisma/client';

@Injectable()
export class AdminQuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadQuestionImageToCloudinary(
    file: Express.Multer.File,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jitu-soal',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error); // DEBUG LOG
            return reject(error);
          }
          if (!result || !result.secure_url) {
            console.error('Cloudinary Result Empty:', result); // DEBUG LOG
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

  async getQuestionBySubtestId(subtestId: string) {
    const subtest = await this.prisma.subtest.findUnique({
      where: { id: subtestId },
    });

    if (!subtest) throw new NotFoundException('Subtest Not Found');

    return await this.prisma.question.findMany({
      where: { subtestId },
      select: {
        id: true,
        type: true,
        imageUrl: true,
        content: true,
        points: true,
        explanation: true,
      },
    });
  }

  private validateQuestionData(
    type: QuestionType,
    items?: { isCorrect?: boolean }[],
    correctAnswer?: string,
  ) {
    if (type === 'ISIAN_SINGKAT') {
      if (!correctAnswer || correctAnswer.trim() === '') {
        throw new BadRequestException(
          'Soal Isian Singkat wajib memiliki Kunci Jawaban (correctAnswer).',
        );
      }
    } else if (type === 'PILIHAN_GANDA' || type === 'BENAR_SALAH') {
      if (!items || items.length === 0) {
        throw new BadRequestException(
          'Soal Pilihan Ganda/Benar Salah wajib memiliki opsi jawaban.',
        );
      }

      const correctCount = items.filter((i) => i.isCorrect === true).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          `Soal ${type} harus memiliki TEPAT SATU jawaban benar. Ditemukan: ${correctCount}.`,
        );
      }
    }
  }

  async createQuestion(dto: CreateQuestionDto, subtestId: string) {
    if (
      (dto.type === 'PILIHAN_GANDA' || dto.type === 'BENAR_SALAH') &&
      (!dto.items || dto.items.length === 0)
    ) {
      throw new NotFoundException(
        'Pilihan jawaban harus diinput untuk tipe soal ini!',
      );
    }

    this.validateQuestionData(dto.type, dto.items, dto.correctAnswer);

    return await this.prisma.question.create({
      data: {
        subtestId: subtestId,
        type: dto.type,
        content: dto.content,
        explanation: dto.explanation,
        correctAnswer: dto.correctAnswer,
        points: dto.points ?? 1,
        items: {
          create: dto.items?.map((item) => ({
            content: item.content,
            isCorrect: item.isCorrect,
            order: item.order,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async deleteQuestion(id: string) {
    // Manually delete related items first to avoid foreign key constraint errors
    await this.prisma.questionItem.deleteMany({
      where: { questionId: id },
    });

    return await this.prisma.question.delete({
      where: { id },
    });
  }

  async updateQuestion(dto: UpdateQuestionDto, id: string) {
    if (dto.type) {
      this.validateQuestionData(dto.type, dto.items, dto.correctAnswer);
    }

    // Delete existing items first to avoid duplicates
    if (dto.items) {
      await this.prisma.questionItem.deleteMany({
        where: { questionId: id },
      });
    }

    return await this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type,
        content: dto.content,
        explanation: dto.explanation,
        correctAnswer: dto.correctAnswer,
        points: dto.points,
        items: {
          create: dto.items?.map((item) => ({
            content: item.content,
            isCorrect: item.isCorrect,
            order: item.order,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }
}
