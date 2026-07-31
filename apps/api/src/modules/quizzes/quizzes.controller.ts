import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';

@Controller()
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  @Get('quizzes')
  findAll() {
    return this.service.findAll();
  }

  @Get('quizzes/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('quizzes/:id/attempts')
  startAttempt(@Param('id') id: string) {
    return this.service.startAttempt(id);
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(@Param('attemptId') attemptId: string, @Body('answers') answers: Record<string, any>) {
    return this.service.submitAttempt(attemptId, answers ?? {});
  }
}
