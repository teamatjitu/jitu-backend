import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SUBTEST, TIPE_SOAL } from 'generated/prisma';
import { CreateOpsiDto } from './create-opsi.dto';
import { CreatePembahasanDto } from './create-pembahasan.dto';

export class CreateSoalDto {
  @IsNotEmpty()
  @IsString()
  tryoutId: string;

  @IsEnum(SUBTEST)
  @IsNotEmpty()
  subtestType: SUBTEST;

  @IsString()
  @IsNotEmpty()
  @IsEnum(TIPE_SOAL)
  tipeSoal: TIPE_SOAL;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOpsiDto)
  @ArrayMinSize(2)
  opsi?: CreateOpsiDto[];

  @IsOptional()
  @Type(() => CreatePembahasanDto)
  pembahasan?: CreatePembahasanDto;
}
