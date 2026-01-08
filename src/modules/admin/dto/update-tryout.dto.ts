import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class UpdateTryoutDto {
  @IsString()
  @IsOptional()
  title?: string;

  // ini harga token
  @IsInt()
  @IsOptional()
  solutionPrice?: number;

  @IsDateString()
  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsOptional()
  scheduledStart?: string;

  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
