import { ApiProperty } from '@nestjs/swagger';

export class TryoutAttemptResponseDto {
  @ApiProperty({ description: 'Attempt ID' })
  id: string;

  @ApiProperty({ description: 'Tryout ID' })
  tryoutId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Start timestamp' })
  startedAt: Date;

  @ApiProperty({ description: 'Finish timestamp', required: false })
  finishedAt?: Date;
}

export class SubtestAttemptResponseDto {
  @ApiProperty({ description: 'Subtest attempt ID' })
  id: string;

  @ApiProperty({ description: 'Subtest ID' })
  subtestId: string;

  @ApiProperty({ description: 'Tryout attempt ID' })
  tryoutAttemptId: string;

  @ApiProperty({ description: 'Start timestamp' })
  startedAt: Date;

  @ApiProperty({ description: 'Finish timestamp', required: false })
  finishedAt?: Date;
}

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'Question text' })
  text: string;

  @ApiProperty({ description: 'Answer options', type: [String] })
  options: string[];

  @ApiProperty({ description: 'Selected answer', required: false })
  selectedAnswer?: string;
}

export class AnswerResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Raw score', required: false })
  rawScore?: number;
}

export class TryoutHistoryItemDto {
  @ApiProperty({ description: 'Attempt ID' })
  id: string;

  @ApiProperty({ description: 'Tryout ID' })
  tryoutId: string;

  @ApiProperty({ description: 'Tryout name' })
  tryoutName: string;

  @ApiProperty({ description: 'Final score' })
  score: number;

  @ApiProperty({ description: 'Start timestamp' })
  startedAt: Date;

  @ApiProperty({ description: 'Finish timestamp' })
  finishedAt: Date;
}

export class TryoutHistoryResponseDto {
  @ApiProperty({
    description: 'List of tryout attempts',
    type: [TryoutHistoryItemDto],
  })
  items: TryoutHistoryItemDto[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position' })
  rank: number;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiProperty({ description: 'Final score' })
  score: number;

  @ApiProperty({ description: 'Completion timestamp' })
  finishedAt: Date;
}

export class LeaderboardResponseDto {
  @ApiProperty({
    description: 'Leaderboard entries',
    type: [LeaderboardEntryDto],
  })
  entries: LeaderboardEntryDto[];

  @ApiProperty({ description: 'Total number of entries' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class CalculateScoresResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Number of attempts processed' })
  processedAttempts: number;
}

export class SubtestInfoDto {
  @ApiProperty({ description: 'Subtest ID' })
  id: string;

  @ApiProperty({ description: 'Subtest name' })
  name: string;

  @ApiProperty({ description: 'Subtest type' })
  type: string;

  @ApiProperty({ description: 'Subtest category' })
  kategori: string;

  @ApiProperty({ description: 'Duration in minutes' })
  duration: number;
}

export class TryoutResponseDto {
  @ApiProperty({ description: 'Tryout ID' })
  id: string;

  @ApiProperty({ description: 'Tryout name' })
  name: string;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Published date' })
  publishedAt: Date;

  @ApiProperty({ description: 'Closed date' })
  closedAt: Date;

  @ApiProperty({ description: 'Is closed' })
  isClosed: boolean;

  @ApiProperty({ description: 'Subtests', type: [SubtestInfoDto] })
  subtest: SubtestInfoDto[];
}

export class CreateTryoutResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created tryout data', type: TryoutResponseDto })
  data: TryoutResponseDto;
}
