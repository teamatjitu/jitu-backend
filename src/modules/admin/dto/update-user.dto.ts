import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from 'generated/prisma/enums';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsInt()
  tokenBalance?: number;

  @IsString()
  @IsOptional()
  password?: string;
}
