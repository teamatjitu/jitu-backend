import { PartialType } from '@nestjs/swagger';
import { CreateOpsiDto } from './create-opsi.dto';

export class UpdateOpsiDto extends PartialType(CreateOpsiDto) {}
