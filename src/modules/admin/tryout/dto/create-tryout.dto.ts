import { IsString, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTryoutDto {
  @ApiProperty({ description: 'Nama tryout' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tahun tryout' })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({ description: 'Durasi tryout dalam menit' })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ description: 'Status tryout ditutup atau tidak' })
  @IsBoolean()
  isCLosed: boolean;
}
