import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateTryoutDto {
  @ApiProperty({ description: 'Tryout name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Year of tryout' })
  @IsInt()
  year: number;

  @ApiProperty({ description: 'Published date', required: false })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({ description: 'Closed date', required: false })
  @IsDateString()
  @IsOptional()
  closedAt?: string;

  @ApiProperty({ description: 'Is closed', default: false })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}
