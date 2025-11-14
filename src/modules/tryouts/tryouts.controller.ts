import { Controller, Post, Param, UseGuards, Get, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

import { Query } from '@nestjs/common';

import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  TryoutAttemptResponseDto,
  SubtestAttemptResponseDto,
  QuestionResponseDto,
  AnswerResponseDto,
  TryoutHistoryResponseDto,
  LeaderboardResponseDto,
  CalculateScoresResponseDto,
} from './dto/tryout-response.dto';
import { TryoutsService } from './tryouts.service';

@ApiTags('tryouts')
@Controller('tryouts')
export class TryoutsController {
  constructor(private readonly tryoutsService: TryoutsService) {}

  @ApiOperation({ summary: 'Start a new tryout attempt' })
  @ApiResponse({
    status: 201,
    description: 'Tryout started successfully',
    type: TryoutAttemptResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Tryout ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/start')
  startTryout(@Param('id') tryoutId: string, @Session() session: UserSession) {
    const userId = session.user.id;
    return this.tryoutsService.startTryout(userId, tryoutId);
  }

  @ApiOperation({ summary: 'Start a subtest attempt' })
  @ApiResponse({
    status: 201,
    description: 'Subtest started successfully',
    type: SubtestAttemptResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'attemptId', description: 'Tryout attempt ID' })
  @ApiParam({ name: 'subtestId', description: 'Subtest ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':attemptId/:subtestId/start')
  startAttempt(
    @Param('attemptId') tryoutAttemptId: string,
    @Param('subtestId') subtestId: string,
  ) {
    return this.tryoutsService.startSubtest(tryoutAttemptId, subtestId);
  }

  @ApiOperation({ summary: 'Get subtest questions for an attempt' })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionResponseDto],
  })
  @ApiParam({ name: 'subtestAttemptId', description: 'Subtest attempt ID' })
  @Get('subtest/attempt/:subtestAttemptId')
  getSubtestQuestions(@Param('subtestAttemptId') subtestAttemptId: string) {
    return this.tryoutsService.getSubtestQuestions(subtestAttemptId);
  }

  @ApiOperation({ summary: 'Submit an answer for a question' })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted successfully',
    type: AnswerResponseDto,
  })
  @ApiParam({ name: 'attemptId', description: 'Tryout attempt ID' })
  @ApiParam({ name: 'subtestAttemptId', description: 'Subtest attempt ID' })
  @Post('attempt/:attemptId/:subtestAttemptId/answer')
  submitAnswer(
    @Param('attemptId') attemptId: string,
    @Param('subtestAttemptId') subtestAttemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.tryoutsService.submitAnswer(
      attemptId,
      subtestAttemptId,
      submitAnswerDto,
    );
  }

  @ApiOperation({ summary: 'Get remaining time for a subtest attempt' })
  @ApiResponse({
    status: 200,
    description: 'Remaining time retrieved successfully',
  })
  @ApiParam({ name: 'subtestAttemptId', description: 'Subtest attempt ID' })
  @Get('subtest/attempt/:subtestAttemptId/remaining-time')
  getRemainingTime(@Param('subtestAttemptId') subtestAttemptId: string) {
    return this.tryoutsService.getRemainingTime(subtestAttemptId);
  }

  @ApiOperation({ summary: 'Finish a subtest attempt' })
  @ApiResponse({
    status: 200,
    description: 'Subtest finished successfully',
    type: AnswerResponseDto,
  })
  @ApiParam({ name: 'subtestAttemptId', description: 'Subtest attempt ID' })
  @Post('subtest/attempt/:subtestAttemptId/finish')
  finishSubtest(@Param('subtestAttemptId') subtestAttemptId: string) {
    return this.tryoutsService.finishSubtest(subtestAttemptId);
  }

  @ApiOperation({ summary: 'Finish a tryout attempt' })
  @ApiResponse({
    status: 200,
    description: 'Tryout finished successfully',
    type: AnswerResponseDto,
  })
  @ApiParam({ name: 'attemptId', description: 'Tryout attempt ID' })
  @Post('attempt/:attemptId/finish')
  finishTryout(@Param('attemptId') attemptId: string) {
    return this.tryoutsService.finishTryout(attemptId);
  }

  @ApiOperation({ summary: 'Get user tryout history' })
  @ApiResponse({
    status: 200,
    description: 'History retrieved successfully',
    type: TryoutHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('history')
  getTryoutHistory(
    @Session() session: UserSession,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = session.user.id;
    return this.tryoutsService.getTryoutHistory(userId, paginationDto);
  }

  @ApiOperation({ summary: 'Get tryout leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tryout ID' })
  @Get(':id/leaderboard')
  getLeaderboard(
    @Param('id') tryoutId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tryoutsService.getLeaderboard(tryoutId, paginationDto);
  }

  @ApiOperation({ summary: 'Calculate final scaled scores for a tryout' })
  @ApiResponse({
    status: 200,
    description: 'Scores calculated successfully',
    type: CalculateScoresResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tryout ID' })
  @Post(':id/calculate-scores')
  calculateFinalScores(@Param('id') tryoutId: string) {
    return this.tryoutsService.calculateScaledScores(tryoutId);
  }

  @ApiOperation({
    summary: 'Get subtest attempt details with questions and answers',
  })
  @ApiResponse({
    status: 200,
    description: 'Subtest attempt details retrieved successfully',
  })
  @ApiParam({ name: 'subtestAttemptId', description: 'Subtest attempt ID' })
  @Get('subtest/attempt/:subtestAttemptId/details')
  getSubtestAttemptDetails(
    @Param('subtestAttemptId') subtestAttemptId: string,
  ) {
    return this.tryoutsService.getSubtestAttemptDetails(subtestAttemptId);
  }
}
