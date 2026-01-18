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
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Get()
  async getAllTryouts(): Promise<TryOutCardDto[]> {
    return this.tryoutService.getTryouts();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getTryoutById(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<TryoutDetailDto> {
    return this.tryoutService.getTryoutById(id, session.user.id);
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
}
