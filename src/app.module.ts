import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DailyModule } from './modules/daily/daily.module';
import { HistoryModule } from './modules/history/history.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ShopModule } from './modules/shop/shop.module';
import { TryoutModule } from './modules/tryout/tryout.module';
import { PrismaModule } from './prisma.module';
import { ExamModule } from './modules/exam/exam.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    PrismaModule,
    DashboardModule,
    DailyModule,
    HistoryModule,
    ReferralModule,
    ShopModule,
    TryoutModule,
    ExamModule,
    AdminModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
