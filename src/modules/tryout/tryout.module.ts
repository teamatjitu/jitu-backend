import { Module } from '@nestjs/common';
import { TryoutController } from './tryout.controller';
import { TryoutService } from './tryout.service';

@Module({
  controllers: [TryoutController],
  providers: [TryoutService],
})
export class TryoutModule {}
