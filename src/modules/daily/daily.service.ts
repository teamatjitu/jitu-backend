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
        userAnswer: existingLog.userAnswer || undefined, // Return jawaban user
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

    // Use deterministic selection based on HASH (ID + Date)
    // This ensures adding new questions doesn't shift the selection for today.
    const questions = await this.prisma.question.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Tidak ada soal yang tersedia');
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Find best ID via Hash
    let bestId = questions[0].id;
    let maxHash = -1;

    for (const q of questions) {
      const input = q.id + dateStr;
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      hash = Math.abs(hash);

      if (hash > maxHash) {
        maxHash = hash;
        bestId = q.id;
      }
    }

    const question = await this.prisma.question.findUnique({
      where: { id: bestId },
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

    let isCorrect = false;

    // Logic Jawaban
    if (question.type === 'ISIAN_SINGKAT') {
      // Untuk isian singkat, bandingkan string jawaban
      if (!question.correctAnswer) {
        // Fallback safety if DB is missing correct answer
        isCorrect = false;
      } else {
        const userAnswer = payload.answer.trim().toLowerCase();
        const correctAnswer = question.correctAnswer.trim().toLowerCase();
        isCorrect = userAnswer === correctAnswer;
      }
    } else {
      // Untuk Pilihan Ganda / Benar Salah, cek ID item
      const selectedItem = await this.prisma.questionItem.findUnique({
        where: { id: payload.answer },
      });

      if (!selectedItem || selectedItem.questionId !== payload.questionId) {
        // Jika payload bukan ID valid atau bukan milik soal ini
        throw new BadRequestException('Jawaban tidak valid!');
      }
      isCorrect = selectedItem.isCorrect;
    }

    // Streak Logic
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const lastDate = user?.lastDailyDate;
    let newStreak = user?.currentStreak || 0;

    // Hitung tanggal kemarin (untuk cek streak continuity)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (isCorrect) {
      if (lastDate) {
        const lastDateNormalized = new Date(lastDate);
        lastDateNormalized.setHours(0, 0, 0, 0);

        // Jika terakhir jawab kemarin -> Streak Lanjut
        if (lastDateNormalized.getTime() === yesterday.getTime()) {
          newStreak += 1;
        } 
        // Jika terakhir jawab hari ini (double check logic) -> Tetap (Harusnya kena block di awal)
        else if (lastDateNormalized.getTime() === today.getTime()) {
           // Do nothing, keep streak
        } 
        // Jika terlewat sehari atau lebih -> Reset jadi 1
        else {
          newStreak = 1;
        }
      } else {
        // Belum pernah jawab -> Streak 1
        newStreak = 1;
      }
    } else {
      // Jawaban salah -> Reset Streak
      newStreak = 0;
    }

    // Save to database
    await this.prisma.$transaction([
      this.prisma.dailyQuestionLog.create({
        data: {
          userId,
          questionId: payload.questionId,
          userAnswer: payload.answer, // Simpan jawaban user
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
