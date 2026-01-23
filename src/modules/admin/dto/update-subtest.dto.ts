import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubtestDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  name?: string;
}
