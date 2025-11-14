import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { AdminModule } from './modules/admin/admin.module';
import { TryoutsModule } from './modules/tryouts/tryouts.module';
import { PrismaService } from './prisma.service';
import { SoalModule } from './modules/admin/soal/soal.module';

@Module({
  imports: [AuthModule.forRoot(auth), AdminModule, TryoutsModule, SoalModule],

  controllers: [AppController],

  providers: [AppService, PrismaService],
})
export class AppModule {}
