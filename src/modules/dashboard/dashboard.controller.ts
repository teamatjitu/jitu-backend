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
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('profile')
  async getProfile(@Session() session: UserSession) {
    return this.dashboardService.getProfile(session.user.id);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('image'))
  async updateProfile(
    @Body() payload: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    return this.dashboardService.updateProfile(session.user.id, payload, file);
  }

  @Get('stats')
  async getStats(@Session() session: UserSession): Promise<UserStatsDto> {
    return this.dashboardService.getUserStats(session.user.id);
  }

  @Get('score-history')
  async getScoreHistory(@Session() session: UserSession) {
    return this.dashboardService.getScoreHistory(session.user.id);
  }

  @Get('tryouts/ongoing')
  async getOngoingTryouts(@Session() session: UserSession) {
    return this.dashboardService.getOngoingTryouts(session.user.id);
  }

  @Get('tryouts/available')
  async getAvailableTryouts(@Session() session: UserSession) {
    return this.dashboardService.getAvailableTryouts(session.user.id);
  }
}
