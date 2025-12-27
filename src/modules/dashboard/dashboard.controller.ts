import {
  Body,
  Controller,
  Put,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { DashboardService } from './dashboard.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatsDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Put('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateProfile(
    @Body() payload: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    return this.dashboardService.updateProfile(session.user.id, payload, file);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getStats(@Session() session: UserSession): Promise<UserStatsDto> {
    return this.dashboardService.getUserStats(session.user.id);
  }
}
