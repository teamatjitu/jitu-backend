import { Controller, Get } from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';

@Controller('tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Get('active')
  async getActiveTryouts(): Promise<TryOutCardDto[]> {
    return this.tryoutService.getActiveTryouts();
  }

  @Get('available')
  async getAvailableTryouts(): Promise<TryOutCardDto[]> {
    return this.tryoutService.getAvailableTryouts();
  }

  @Get()
  async getAllTryouts(): Promise<TryOutCardDto[]> {
    return this.tryoutService.getTryouts();
  }
}
