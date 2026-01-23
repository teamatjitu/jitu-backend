import { Module, forwardRef } from '@nestjs/common';
import { TryoutController } from './tryout.controller';
import { TryoutService } from './tryout.service';
import { ExamModule } from '../exam/exam.module';

@Module({
  imports: [forwardRef(() => ExamModule)],
  controllers: [TryoutController],
  providers: [TryoutService],
  exports: [TryoutService],
})
export class TryoutModule {}
