import { Controller, Get, Post, Body, Param, Sse } from '@nestjs/common';
import { ExamService } from './exam.service';
import { Observable } from 'rxjs';
// [FIX] Hapus import Public dari thallesp

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post(':tryoutId/start')
  async startExam(
    @Param('tryoutId') tryoutId: string,
    @Body('userId') userId: string,
  ) {
    return this.examService.startExam(tryoutId, userId);
  }

  @Sse(':attemptId/stream')
  streamExamStatus(
    @Param('attemptId') attemptId: string,
  ): Observable<MessageEvent> {
    return this.examService.getExamStream(attemptId);
  }

  @Post(':attemptId/answer')
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() answerData: { questionId: string; answerId: string },
  ) {
    return this.examService.saveAnswer(
      attemptId,
      answerData.questionId,
      answerData.answerId,
    );
  }

  @Get('ping')
  ping() {
    return 'pong';
  }
}
