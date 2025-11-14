import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SoalService } from './soal.service';
import { CreateSoalDto } from './dto/create-soal.dto';
import { UpdateSoalDto } from './dto/update-soal.dto';

@ApiTags('admin/soal')
@Controller('admin/soal')
export class SoalController {
  constructor(private readonly soalService: SoalService) {}

  @Post()
  @ApiOperation({ summary: 'Buat soal baru' })
  @ApiResponse({ status: 201, description: 'Soal berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createSoalDto: CreateSoalDto) {
    return this.soalService.create(createSoalDto);
  }

  @Get('tryout/:tryoutId/subtest/:subtestType')
  @ApiOperation({
    summary: 'Dapatkan soal berdasarkan tryout ID dan subtest type',
  })
  @ApiParam({ name: 'tryoutId', description: 'ID tryout' })
  @ApiParam({
    name: 'subtestType',
    description: 'Tipe subtest (PU, PPU, PBM, PK, LBI, LBE, PM)',
  })
  @ApiResponse({ status: 200, description: 'Berhasil mendapatkan soal' })
  @ApiResponse({
    status: 404,
    description: 'Tryout atau subtest tidak ditemukan',
  })
  async findByTryoutAndSubtest(
    @Param('tryoutId') tryoutId: string,
    @Param('subtestType') subtestType: string,
  ) {
    return await this.soalService.findByTryoutAndSubtest(tryoutId, subtestType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan soal berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID soal' })
  @ApiResponse({ status: 200, description: 'Berhasil mendapatkan soal' })
  @ApiResponse({ status: 404, description: 'Soal tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return await this.soalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update soal berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID soal' })
  @ApiResponse({ status: 200, description: 'Soal berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Soal tidak ditemukan' })
  async update(@Param('id') id: string, @Body() updateSoalDto: UpdateSoalDto) {
    return await this.soalService.update(id, updateSoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus soal berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID soal' })
  @ApiResponse({ status: 200, description: 'Soal berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Soal tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.soalService.remove(id);
  }
}
