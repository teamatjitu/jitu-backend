import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TryoutModule } from './tryout/tryout.module';
import { SoalModule } from './soal/soal.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [TryoutModule, SoalModule],
})
export class AdminModule {}
