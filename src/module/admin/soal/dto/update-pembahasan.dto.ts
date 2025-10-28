import { PartialType } from '@nestjs/mapped-types';
import { CreatePembahasanDto } from './create-pembahasan.dto';

export class UpdatePembahasanDto extends PartialType(CreatePembahasanDto) {}
