import { Module } from '@nestjs/common';
import { TryoutService } from './tryout.service';
import { TryoutController } from './tryout.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TryoutController],
  providers: [TryoutService],
})
export class TryoutModule {}
