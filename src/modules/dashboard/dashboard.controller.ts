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
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { DashboardService } from './dashboard.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubmitDailyAnswerDto, UserStatsDto } from './dto/dashboard.dto';

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

  @Get('daily-question')
  @UseGuards(AuthGuard)
  async getDailyQuestion(@Session() session: UserSession) {
    return this.dashboardService.getDailyQuestion(session.user.id);
  }

  @Post('answer-question')
  @UseGuards(AuthGuard)
  async answerDailyQuestion(
    @Session() session: UserSession,
    @Body() payload: SubmitDailyAnswerDto,
  ) {
    return this.dashboardService.answerDailyQuestion(session.user.id, payload);
  }

  @Get('score-stats')
  @UseGuards(AuthGuard)
  async getTryoutsScore(@Session() session: UserSession) {
    return this.dashboardService.getScoreHistory(session.user.id);
  }
}
