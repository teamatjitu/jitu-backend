import {
  Body,
  Controller,
  Put,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // [FIX] Wajib pakai import type

import { DashboardService } from './dashboard.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubmitDailyAnswerDto, UserStatsDto } from './dto/dashboard.dto';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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

  @Get('daily-question')
  async getDailyQuestion(@Session() session: UserSession) {
    return this.dashboardService.getDailyQuestion(session.user.id);
  }

  @Post('answer-question')
  async answerDailyQuestion(
    @Session() session: UserSession,
    @Body() payload: SubmitDailyAnswerDto,
  ) {
    return this.dashboardService.answerDailyQuestion(session.user.id, payload);
  }

  @Get('score-stats')
  async getTryoutsScore(@Session() session: UserSession) {
    return this.dashboardService.getScoreHistory(session.user.id);
  }

  @Get('active-to')
  async getActiveTryouts(@Session() session: UserSession) {
    return this.dashboardService.getActiveTryouts(session.user.id);
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
