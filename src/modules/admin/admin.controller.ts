import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminTryoutService } from './services/tryout.service';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tryoutService: AdminTryoutService,
  ) {}

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('tryouts')
  getTryouts() {
    return this.tryoutService.getTryouts();
  }

  @Post('tryouts')
  createTryout(@Body() createTryoutDto: CreateTryoutDto) {
    return this.tryoutService.createTryout(createTryoutDto);
  }

  @Patch('tryouts/:id')
  updateTryout(
    @Param('id') id: string,
    @Body() updateTryoutDto: UpdateTryoutDto,
  ) {
    return this.tryoutService.updateTryout(id, updateTryoutDto);
  }

  @Delete('tryouts/:id')
  deleteTryout(@Param('id') id: string) {
    return this.tryoutService.deleteTryout(id);
  }

  @Get('tryouts/:id')
  getTryoutById(@Param('id') id: string) {
    return this.tryoutService.getTryoutById(id);
  }
}
