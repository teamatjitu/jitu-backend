import { Get, Controller, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getTryoutsHistory(@Session() session: UserSession) {
    return await this.historyService.getHistoryTryouts(session.user.id);
  }
}
