import { PartialType } from '@nestjs/swagger';
import { CreatePembahasanDto } from './create-pembahasan.dto';

export class UpdatePembahasanDto extends PartialType(CreatePembahasanDto) {}
