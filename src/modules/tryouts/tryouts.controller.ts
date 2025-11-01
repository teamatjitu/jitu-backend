import { Controller, Post, Param, UseGuards, Req, Get , Body } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth'; 
import { TryoutsService } from './tryouts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('tryouts')
export class TryoutsController {
  constructor(private readonly tryoutsService: TryoutsService) {}

  @Post(':id/start')
  startTryout(@Param('id') tryoutId: string, @Req() req) {
    const userId = req.user.id;
    return this.tryoutsService.startTryout(userId, tryoutId);
  }

  @Get('attempt/:attemptId')
  getTryoutQuestions(@Param('attemptId') attemptId: string) {
    return this.tryoutsService.getTryoutQuestions(attemptId);
  }

  @Post('attempt/:attemptId/answer')
  submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.tryoutsService.submitAnswer(attemptId, submitAnswerDto);
  }

  @Post('attempt/:attemptId/finish')
  finishTryout(@Param('attemptId') attemptId: string) {
    return this.tryoutsService.finishTryout(attemptId);
  }
  
  @UseGuards(AuthGuard)
  @Get('history')
  getTryoutHistory(@Req() req) {
    const userId = req.user.id;

    return this.tryoutsService.getTryoutHistory(userId);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') tryoutId: string) {
    return this.tryoutsService.getLeaderboard(tryoutId);
  }


  
}