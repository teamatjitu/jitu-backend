import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOpsiDto {
  @ApiProperty({ description: 'Teks opsi jawaban' })
  @IsString()
  @IsNotEmpty()
  teks: string;

  @ApiProperty({ description: 'Apakah opsi ini jawaban yang benar' })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}
