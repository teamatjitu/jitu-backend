import {
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class CreateTryoutDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsBoolean()
  isCLosed: boolean;

  @IsDateString()
  @IsNotEmpty()
  publishedAt: string;

  @IsDateString()
  @IsNotEmpty()
  closedAt: string;
}
