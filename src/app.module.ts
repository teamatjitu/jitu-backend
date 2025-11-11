import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { AdminModule } from './module/admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [AuthModule.forRoot(auth), AdminModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
