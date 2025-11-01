import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  soalId: string;

  @IsString()
  jawaban: string;
}