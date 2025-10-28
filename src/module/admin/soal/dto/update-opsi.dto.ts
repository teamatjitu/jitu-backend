import { PartialType } from '@nestjs/mapped-types';
import { CreateOpsiDto } from './create-opsi.dto';

export class UpdateOpsiDto extends PartialType(CreateOpsiDto) {}
