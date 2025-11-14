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
import { TryoutService } from './tryout.service';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';
import { CreateUtbkTryoutDto } from './dto/create-utbk-tryout.dto';
import { CreateUtbkTryoutResponseDto } from './dto/tryout-response.dto';

@ApiTags('admin/tryout')
@Controller('admin/tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Post('utbk')
  @ApiOperation({ summary: 'Buat tryout UTBK lengkap dengan 7 subtest' })
  @ApiResponse({
    status: 201,
    description: 'Tryout UTBK berhasil dibuat dengan semua subtest',
    type: CreateUtbkTryoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  createUTBK(@Body() createUtbkTryoutDto: CreateUtbkTryoutDto) {
    return this.tryoutService.createUTBKTryout(createUtbkTryoutDto);
  }

  @Post()
  @ApiOperation({ summary: 'Buat tryout baru (custom)' })
  @ApiResponse({ status: 201, description: 'Tryout berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createTryoutDto: CreateTryoutDto) {
    return this.tryoutService.create(createTryoutDto);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan semua tryout' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mendapatkan semua tryout',
  })
  async findAll() {
    return await this.tryoutService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan tryout berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID tryout' })
  @ApiResponse({ status: 200, description: 'Berhasil mendapatkan tryout' })
  @ApiResponse({ status: 404, description: 'Tryout tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return await this.tryoutService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tryout berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID tryout' })
  @ApiResponse({ status: 200, description: 'Tryout berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Tryout tidak ditemukan' })
  async update(
    @Param('id') id: string,
    @Body() updateTryoutDto: UpdateTryoutDto,
  ) {
    await this.tryoutService.update(id, updateTryoutDto);
    const tryout = await this.tryoutService.findOne(id);
    return { message: 'Tryout Updated!', tryout };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus tryout berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID tryout' })
  @ApiResponse({ status: 200, description: 'Tryout berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Tryout tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.tryoutService.remove(id);
  }
}
