import { PartialType } from '@nestjs/swagger';
import { CreateTryoutDto } from './create-tryout.dto';

export class UpdateTryoutDto extends PartialType(CreateTryoutDto) {}
