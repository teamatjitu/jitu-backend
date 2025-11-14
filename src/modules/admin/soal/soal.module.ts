import { Module } from '@nestjs/common';
import { SoalController } from './soal.controller';
import { SoalService } from './soal.service';
import { PrismaModule } from '@/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SoalController],
  providers: [SoalService],
})
export class SoalModule {}
