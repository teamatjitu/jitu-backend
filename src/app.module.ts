import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HistoryModule } from './modules/history/history.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ShopModule } from './modules/shop/shop.module';
import { TryoutModule } from './modules/tryout/tryout.module';
import { PrismaModule } from './prisma.module';
import { ExamModule } from './exam/exam.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    AuthModule.forRoot({ auth }),
    PrismaModule,
    DashboardModule,
    HistoryModule,
    ReferralModule,
    ShopModule,
    TryoutModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
