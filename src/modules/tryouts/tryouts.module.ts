import { Module } from '@nestjs/common';
import { TryoutsController } from './tryouts.controller';
import { TryoutsService } from './tryouts.service';
import { PrismaModule } from '@/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TryoutsController],
  providers: [TryoutsService],
})
export class TryoutsModule {}
