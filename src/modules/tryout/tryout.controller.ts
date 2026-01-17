import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // Gunakan import type!

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
  @UseGuards(AuthGuard)
  async getTryoutExam(
    @Param('id') id: string,
    @Param('subtestId', ParseIntPipe) subtestId: number,
  ) {
    return this.tryoutService.getSubtestQuestions(id, subtestId);
  }
}
