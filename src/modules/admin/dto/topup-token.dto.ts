import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class TopupTokenDto {
  @IsInt()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
