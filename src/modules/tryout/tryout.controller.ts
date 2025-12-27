import { Controller, Get } from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { TryOutCardDto } from './dto/tryout.dto';

@Controller('tryout')
export class TryoutController {
  constructor(private readonly tryoutService: TryoutService) {}

  //   @Get()
  //   async getAllTryouts(): Promise<TryOutCardDto[]> {
  //     return this.tryoutService.getTryouts();
  //   }
}
