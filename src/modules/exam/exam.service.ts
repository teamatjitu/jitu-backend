import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Observable, interval, map, switchMap, of } from 'rxjs';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  async startExam(tryOutId: string, userId: string) {
    const existing = await this.prisma.tryOutAttempt.findFirst({
      where: { userId, tryOutId, status: 'IN_PROGRESS' },
    });

    if (existing) return existing;

    return this.prisma.tryOutAttempt.create({
      data: {
        userId,
        tryOutId,
        status: 'IN_PROGRESS',
        totalScore: 0,
        startedAt: new Date(),
      },
    });
  }

  // SSE untuk memperbarui jam tryout simultaniously
  getExamStream(attemptId: string): Observable<MessageEvent> {
    return interval(1000).pipe(
      switchMap(async () => {
        const attempt = await this.prisma.tryOutAttempt.findUnique({
          where: { id: attemptId },
          include: { tryOut: { include: { subtests: true } } },
        });

        if (!attempt || attempt.status !== 'IN_PROGRESS') {
          return { data: { status: 'FINISHED', remainingSeconds: 0 } };
        }

        const totalDurationMinutes = attempt.tryOut.subtests.reduce(
          (acc, sub) => acc + sub.durationMinutes,
          0,
        );
        const endTime = new Date(
          attempt.startedAt.getTime() + totalDurationMinutes * 60000,
        );
        const now = new Date();
        const remainingSeconds = Math.max(
          0,
          Math.floor((endTime.getTime() - now.getTime()) / 1000),
        );

        if (remainingSeconds === 0) await this.finishExam(attemptId);

        return {
          data: {
            status: 'IN_PROGRESS',
            remainingSeconds,
            serverTime: new Date().toISOString(),
          },
        };
      }),
      map((data) => ({ data }) as MessageEvent),
    );
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    questionItemId: string,
  ) {
    return this.prisma.userAnswer.upsert({
      where: {
        tryOutAttemptId_questionId: {
          tryOutAttemptId: attemptId,
          questionId: questionId,
        },
      },
      update: {
        questionItemId: questionItemId,
        updatedAt: new Date(),
      },
      create: {
        tryOutAttemptId: attemptId,
        questionId: questionId,
        questionItemId: questionItemId,
      },
    });
  }

  async finishExam(attemptId: string) {
    return this.prisma.tryOutAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'FINISHED',
        finishedAt: new Date(),
      },
    });
  }
}
