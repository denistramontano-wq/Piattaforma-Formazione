import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Body('answers') answers: Record<string, any>) {
    return this.service.submit(id, answers ?? {});
  }
}
