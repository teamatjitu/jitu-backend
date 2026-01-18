import { Controller, Get, Post, Body, Param, Sse } from '@nestjs/common';
import { ExamService } from './exam.service';
import { Observable } from 'rxjs';
import { type UserSession, Session } from '@thallesp/nestjs-better-auth';

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post(':tryoutId/start')
  async startExam(
    @Param('tryoutId') tryoutId: string,
    @Session() session: UserSession,
  ) {
    return this.examService.startExam(tryoutId, session.user.id);
  }

  @Post(':attemptId/answer')
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body()
    answerData: {
      questionId: string;
      answerId?: string;
      inputText?: string;
    },
  ) {
    return this.examService.saveAnswer(
      attemptId,
      answerData.questionId,
      answerData.answerId,
      answerData.inputText,
    );
  }

  @Sse(':attemptId/stream/:order') // Tambahkan :order di sini
  streamExamStatus(
    @Param('attemptId') attemptId: string,
    @Param('order') order: string, // Ambil parameter order
  ): Observable<MessageEvent> {
    return this.examService.getExamStream(attemptId, Number(order));
  }

  @Post(':attemptId/finish')
  async finish(@Param('attemptId') attemptId: string) {
    return this.examService.finishExam(attemptId);
  }

  @Get('ping')
  ping() {
    return 'pong';
  }
}
