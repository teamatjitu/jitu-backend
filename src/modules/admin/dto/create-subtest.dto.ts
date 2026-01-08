import { IsString, IsInt, IsEnum } from 'class-validator';
import { SubtestName } from 'generated/prisma/enums';

export class CreateSubtestDto {
  @IsString()
  tryoutId: string;

  @IsEnum(SubtestName)
  name: SubtestName;

  @IsInt()
  durationMinutes: number;

  @IsInt()
  order: number;
}
