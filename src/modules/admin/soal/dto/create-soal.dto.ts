import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OpsiDto {
  @ApiProperty({ description: 'Teks opsi' })
  @IsString()
  teks: string;

  @ApiProperty({ description: 'Apakah opsi ini benar' })
  @IsBoolean()
  isCorrect: boolean;
}

export class PembahasanDto {
  @ApiProperty({ description: 'Pembahasan soal' })
  @IsString()
  pembahasan: string;
}

export class CreateSoalDto {
  @ApiProperty({ description: 'ID tryout' })
  @IsNotEmpty()
  @IsString()
  tryoutId: string;

  @ApiProperty({
    description: 'Subtest type',
    enum: ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'],
  })
  @IsEnum(['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'])
  subtestType: 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';

  @ApiProperty({
    description: 'Tipe soal',
    enum: ['PILIHAN_GANDA', 'ISIAN_SINGKAT', 'BENAR_SALAH'],
  })
  @IsEnum(['PILIHAN_GANDA', 'ISIAN_SINGKAT', 'BENAR_SALAH'])
  tipeSoal: 'PILIHAN_GANDA' | 'ISIAN_SINGKAT' | 'BENAR_SALAH';

  @ApiProperty({ description: 'Pertanyaan' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description: 'Daftar opsi jawaban',
    type: [OpsiDto],
    minItems: 2,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpsiDto)
  @ArrayMinSize(2)
  opsi?: OpsiDto[];

  @ApiPropertyOptional({
    description: 'Pembahasan soal',
    type: PembahasanDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PembahasanDto)
  pembahasanSoal?: PembahasanDto;
}
