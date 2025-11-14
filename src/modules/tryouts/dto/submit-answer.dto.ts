import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  soalId: string;

  @ApiProperty({ description: 'Selected answer' })
  @IsString()
  jawaban: string;
}
