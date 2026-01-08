import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './admin.controller';
import { AdminTryoutService } from './services/tryout.service';
import { AdminSubtestService } from './services/subtest.service';
import { AdminQuestionService } from './services/question.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminTryoutService,
    AdminSubtestService,
    AdminQuestionService,
  ],
})
export class AdminModule {}
