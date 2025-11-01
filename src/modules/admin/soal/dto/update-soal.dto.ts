import { PartialType } from '@nestjs/mapped-types';
import { CreateSoalDto } from './create-soal.dto';

export class UpdateSoalDto extends PartialType(CreateSoalDto) {}
