import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // Gunakan import type!

import { DailyService } from './daily.service';
import { SubmitDailyAnswerDto } from './dto/daily.dto';

@Controller('daily')
@UseGuards(AuthGuard)
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get('question')
  async getDailyQuestion(@Session() session: UserSession) {
    return this.dailyService.getDailyQuestion(session.user.id);
  }

  @Get('streak')
  async getStreak(@Session() session: UserSession) {
    return this.dailyService.getStreak(session.user.id);
  }

  @Post('answer')
  async answerDailyQuestion(
    @Session() session: UserSession,
    @Body() payload: SubmitDailyAnswerDto,
  ) {
    return this.dailyService.answerDailyQuestion(session.user.id, payload);
  }
}
