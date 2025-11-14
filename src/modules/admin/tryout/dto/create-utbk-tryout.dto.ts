import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsDateString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubtestCustomization {
  @ApiProperty({ 
    description: 'Subtest type', 
    enum: ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'],
    example: 'PU'
  })
  @IsString()
  type: 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';

  @ApiProperty({ 
    description: 'Custom duration in minutes (optional)', 
    required: false,
    example: 35
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiProperty({ 
    description: 'Number of questions for this subtest (optional)', 
    required: false,
    example: 20
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  questionCount?: number;
}

export class CreateUtbkTryoutDto {
  @ApiProperty({ description: 'Tryout name', example: 'UTBK 2024 - Try Out 1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Year of tryout', example: 2024 })
  @IsInt()
  year: number;

  @ApiProperty({ 
    description: 'Published date (ISO 8601)', 
    required: false,
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({ 
    description: 'Closed date (ISO 8601)', 
    required: false,
    example: '2024-12-31T23:59:59.000Z'
  })
  @IsDateString()
  @IsOptional()
  closedAt?: string;

  @ApiProperty({ 
    description: 'Is closed', 
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;

  @ApiProperty({
    description: 'Custom subtest configurations (optional). If not provided, default config will be used.',
    type: [SubtestCustomization],
    required: false,
    example: [
      { type: 'PU', duration: 35, questionCount: 25 },
      { type: 'LBI', duration: 50 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtestCustomization)
  @IsOptional()
  subtestCustomizations?: SubtestCustomization[];
}
