import { Get, Controller, Session, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getTryoutsHistory(@Session() session: UserSession) {
    return await this.historyService.getHistoryTryouts(session.user.id);
  }
}
