import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateOpsiDto {
  @IsString()
  @IsNotEmpty()
  teks: string;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}
