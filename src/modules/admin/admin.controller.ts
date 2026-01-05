import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('tryouts')
  getTryouts() {
    return this.adminService.getTryouts();
  }

  @Post('tryouts')
  createTryout(@Body() createTryoutDto: CreateTryoutDto) {
    return this.adminService.createTryout(createTryoutDto);
  }

  @Patch('tryouts/:id')
  updateTryout(
    @Param('id') id: string,
    @Body() updateTryoutDto: UpdateTryoutDto,
  ) {
    return this.adminService.updateTryout(id, updateTryoutDto);
  }

  @Delete('tryouts/:id')
  deleteTryout(@Param('id') id: string) {
    return this.adminService.deleteTryout(id);
  }
}
