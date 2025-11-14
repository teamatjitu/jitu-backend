import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Number of questions' })
  questionCount: number;
}

export class TryoutDetailDto {
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

export class CreateUtbkTryoutResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created tryout data', type: TryoutDetailDto })
  data: TryoutDetailDto;
}
