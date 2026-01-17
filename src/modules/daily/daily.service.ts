import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  SubmitDailyAnswerDto,
  DailyQuestionResponseDto,
  DailyStreakResponseDto,
  DailyAnswerResponseDto,
} from './dto/daily.dto';

@Injectable()
export class DailyService {
  constructor(private prisma: PrismaService) {}

  async getDailyQuestion(userId: string): Promise<DailyQuestionResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already answered today
    const existingLog = await this.prisma.dailyQuestionLog.findFirst({
      where: {
        userId,
        completedAt: { gte: today },
      },
      include: {
        question: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (existingLog) {
      return {
        alreadyAnswered: true,
        isCorrect: existingLog.isCorrect,
        question: {
          id: existingLog.question.id,
          type: existingLog.question.type,
          content: existingLog.question.content,
          imageUrl: existingLog.question.imageUrl,
          narration: existingLog.question.narration,
          options: existingLog.question.items.map((item) => ({
            id: item.id,
            content: item.content,
            order: item.order,
          })),
        },
      };
    }

    // Use deterministic selection based on date
    const totalQuestion = await this.prisma.question.count();
    if (totalQuestion === 0) {
      throw new BadRequestException('Tidak ada soal yang tersedia');
    }

    const now = new Date();
    const dateSeed =
      now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const skip = dateSeed % totalQuestion;

    const question = await this.prisma.question.findFirst({
      skip: skip,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!question) {
      throw new BadRequestException('Tidak ada soal yang tersedia');
    }

    return {
      alreadyAnswered: false,
      question: {
        id: question.id,
        type: question.type,
        content: question.content,
        imageUrl: question.imageUrl,
        narration: question.narration,
        options: question.items.map((item) => ({
          id: item.id,
          content: item.content,
          order: item.order,
        })),
      },
    };
  }

  async getStreak(userId: string): Promise<DailyStreakResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });

    // Get best streak (max consecutive correct answers)
    const logs = await this.prisma.dailyQuestionLog.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
      select: { isCorrect: true, completedAt: true },
    });

    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const log of logs) {
      const logDate = new Date(log.completedAt);
      logDate.setHours(0, 0, 0, 0);

      if (lastDate) {
        const expectedDate = new Date(lastDate);
        expectedDate.setDate(expectedDate.getDate() + 1);

        // Check if consecutive day
        if (logDate.getTime() === expectedDate.getTime()) {
          if (log.isCorrect) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        } else {
          // Gap in days, reset
          tempStreak = log.isCorrect ? 1 : 0;
        }
      } else {
        tempStreak = log.isCorrect ? 1 : 0;
      }

      lastDate = logDate;
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    const totalProblemsSolved = await this.prisma.dailyQuestionLog.count({
      where: { userId, isCorrect: true },
    });

    return {
      currentStreak: user?.currentStreak || 0,
      bestStreak,
      totalProblemsSolved,
    };
  }

  async answerDailyQuestion(
    userId: string,
    payload: SubmitDailyAnswerDto,
  ): Promise<DailyAnswerResponseDto> {
    // Check if user already answered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await this.prisma.dailyQuestionLog.findFirst({
      where: {
        userId,
        completedAt: { gte: today },
      },
    });

    if (existingLog) {
      throw new BadRequestException('Anda sudah menjawab soal hari ini!');
    }

    // Verify the question exists
    const question = await this.prisma.question.findUnique({
      where: { id: payload.questionId },
      include: {
        items: true,
      },
    });

    if (!question) {
      throw new BadRequestException('Soal tidak ditemukan!');
    }

    // Find the selected answer
    const selectedItem = await this.prisma.questionItem.findUnique({
      where: { id: payload.answer },
    });

    if (!selectedItem || selectedItem.questionId !== payload.questionId) {
      throw new BadRequestException('Jawaban tidak valid!');
    }

    const isCorrect = selectedItem.isCorrect;

    // Get user data
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const lastDate = user?.lastDailyDate;
    let newStreak = user?.currentStreak || 0;

    const yesterdayStart = new Date(today);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Check if user answered yesterday to maintain streak
    let shouldResetStreak = false;
    if (lastDate) {
      const lastDateNormalized = new Date(lastDate);
      lastDateNormalized.setHours(0, 0, 0, 0);

      if (lastDateNormalized.getTime() !== yesterdayStart.getTime()) {
        shouldResetStreak = true;
      }
    }

    if (isCorrect) {
      newStreak = shouldResetStreak ? 1 : newStreak + 1;
    } else {
      newStreak = 0;
    }

    // Save to database
    await this.prisma.$transaction([
      this.prisma.dailyQuestionLog.create({
        data: {
          userId,
          questionId: payload.questionId,
          isCorrect,
          completedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          lastDailyDate: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      isCorrect,
      newStreak,
      explanation: question.explanation || undefined,
      message: isCorrect ? 'Jawaban Anda benar!' : 'Jawaban Anda kurang tepat.',
    };
  }
}
