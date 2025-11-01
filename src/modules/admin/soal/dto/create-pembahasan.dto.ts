import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePembahasanDto {
  @IsString()
  @IsNotEmpty()
  pembahasan: string;
}
