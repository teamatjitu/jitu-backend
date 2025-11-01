import { Module } from '@nestjs/common';
import { SoalService } from './soal.service';
import { SoalController } from './soal.controller';
import { PrismaModule } from '@/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SoalController],
  providers: [SoalService],
})
export class SoalModule {}
