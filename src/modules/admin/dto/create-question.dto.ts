import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from 'generated/prisma/enums';
import { Type } from 'class-transformer';

export class CreateQuestionItemDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  order: number;
}

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsInt()
  @IsOptional()
  points?: number;

  // kalau isian singkat wajib diisi
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  // wajib jika BS atau PG
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionItemDto)
  @IsOptional()
  items?: CreateQuestionItemDto[];
}
