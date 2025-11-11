import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SoalService } from './soal.service';
import { CreateSoalDto } from './dto/create-soal.dto';
import { UpdateSoalDto } from './dto/update-soal.dto';

@Controller('admin/soal')
export class SoalController {
  constructor(private readonly soalService: SoalService) {}

  @Post()
  create(@Body() createSoalDto: CreateSoalDto) {
    return this.soalService.create(createSoalDto);
  }

  @Get()
  async findAll() {
    return await this.soalService.findAll();
  }

  @Get('tryout/:tryoutId/subtest/:subtestType')
  async findByTryoutAndSubtest(
    @Param('tryoutId') tryoutId: string,
    @Param('subtestType') subtestType: string,
  ) {
    return await this.soalService.findByTryoutAndSubtest(tryoutId, subtestType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.soalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSoalDto: UpdateSoalDto) {
    return this.soalService.update(id, updateSoalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.soalService.remove(id);
  }
}
