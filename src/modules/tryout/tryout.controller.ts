import {
  Controller,
  Get,
  Req,
  Param,
  Query,
  UseGuards,
  Post,
} from '@nestjs/common';
import { TryoutService } from './tryout.service';
import {
  TryOutCardDto,
  TryoutDetailDto,
  LeaderboardDto,
} from './dto/tryout.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // Gunakan import type!

@Controller('tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAllTryouts(
    @Session() session: UserSession,
  ): Promise<TryOutCardDto[]> {
    return this.tryoutService.getTryouts(session.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getTryoutById(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<TryoutDetailDto> {
    return this.tryoutService.getTryoutById(id, session.user.id);
  }

  @Get(':id/leaderboard')
  @UseGuards(AuthGuard)
  async getLeaderboard(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<LeaderboardDto> {
    return this.tryoutService.getLeaderboard(id, session.user.id);
  }

  @Get(':id/exam/:subtestId')
  // @UseGuards(AuthGuard) // Opsional: Boleh di-comment jika ingin Public, atau nyalakan jika wajib login
  async getTryoutExam(
    @Param('id') id: string,
    @Param('subtestId') subtestId: string,
    @Query('userId') userIdFromQuery: string,
    @Query('attemptId') attemptId: string,
    @Req() req: any,
  ) {
    // Ambil userId dari Query (prioritas) atau Session
    const userId = userIdFromQuery || req.session?.user?.id || req.user?.id;

    return this.tryoutService.getSubtestQuestions(
      id,
      subtestId,
      userId,
      attemptId,
    );
  }

  @Post(':id/unlock')
  @UseGuards(AuthGuard)
  async unlockTryoutSolution(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.tryoutService.unlockSolution(session.user.id, id);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard)
  async registerTryout(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.tryoutService.registerTryout(session.user.id, id);
  }

  @Get(':id/leaderboard')
  @UseGuards(AuthGuard)
  async getLeaderboard(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.tryoutService.getLeaderboard(id, session.user.id);
  }
}
