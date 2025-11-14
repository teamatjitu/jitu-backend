import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePembahasanDto {
  @ApiProperty({ description: 'Pembahasan soal' })
  @IsString()
  @IsNotEmpty()
  pembahasan: string;
}
