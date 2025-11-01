import { Controller, Post, Param, UseGuards, Req, Get , Body } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth'; 
import { TryoutsService } from './tryouts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Query } from '@nestjs/common';
import { PaginationDto } from './dto/pagination.dto';

@Controller('tryouts')
export class TryoutsController {
  constructor(private readonly tryoutsService: TryoutsService) {}

  // @UseGuards(AuthGuard)
  @Post(':id/start')
  startTryout(@Param('id') tryoutId: string, @Req() req) {
    // const userId = req.user.id;
    const userId = 'cmhfpxw3u00000sc0xjjfgxle';
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
  
  // @UseGuards(AuthGuard)
  @Get('history')
  getTryoutHistory(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = 'cmhfpxw3u00000sc0xjjfgxle';
    return this.tryoutsService.getTryoutHistory(userId, paginationDto);
  }

  @Get(':id/leaderboard')
  getLeaderboard(
    @Param('id') tryoutId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tryoutsService.getLeaderboard(tryoutId, paginationDto);
  }

  @Post(':id/calculate-scores')
  calculateFinalScores(@Param('id') tryoutId: string) {
    return this.tryoutsService.calculateScaledScores(tryoutId);
  }


  
}