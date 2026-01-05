import {
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { TryoutBatch } from 'generated/prisma/client';

export class CreateTryoutDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // ini harga token
  @IsInt()
  solutionPrice: number;

  @IsEnum(TryoutBatch)
  batch: TryoutBatch;

  @IsDateString()
  releaseDate: string;

  @IsDateString()
  scheduledEnd: string;

  @IsDateString()
  scheduledStart: string;
}
