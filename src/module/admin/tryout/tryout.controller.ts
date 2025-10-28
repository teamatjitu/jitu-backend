import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';

@Controller('admin/tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Post()
  create(@Body() createTryoutDto: CreateTryoutDto) {
    return this.tryoutService.create(createTryoutDto);
  }

  @Get()
  async findAll() {
    return await this.tryoutService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.tryoutService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTryoutDto: UpdateTryoutDto,
  ) {
    await this.tryoutService.update(id, updateTryoutDto);
    const tryout = await this.tryoutService.findOne(id);
    return { message: 'Tryout Updated!', tryout };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tryoutService.remove(id);
  }
}
