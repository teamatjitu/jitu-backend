import { PartialType } from '@nestjs/swagger';
import { CreateSoalDto } from './create-soal.dto';

export class UpdateSoalDto extends PartialType(CreateSoalDto) {}
