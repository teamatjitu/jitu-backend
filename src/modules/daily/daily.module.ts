import { Module } from '@nestjs/common';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DailyController],
  providers: [DailyService, PrismaService],
})
export class DailyModule {}
