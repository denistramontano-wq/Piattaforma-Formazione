import { Module } from '@nestjs/common';
import { AdminQuizzesController } from './admin-quizzes.controller';
import { AdminQuizzesService } from './admin-quizzes.service';

@Module({
  controllers: [AdminQuizzesController],
  providers: [AdminQuizzesService],
})
export class AdminQuizzesModule {}
