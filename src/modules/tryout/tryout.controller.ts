import { Controller, Get, Param } from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { TryOutCardDto, TryoutDetailDto } from './dto/tryout.dto';

@Controller('tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  @Get()
  async getAllTryouts(): Promise<TryOutCardDto[]> {
    return this.tryoutService.getTryouts();
  }

  @Get(':id')
  async getTryoutById(@Param('id') id: string): Promise<TryoutDetailDto> {
    // TODO: Ambil userId dari Auth Guard nanti
    const userId = 'user-dummy-123'; 
    return this.tryoutService.getTryoutById(id, userId);
  }
}
