import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { AdminQuizzesService } from './admin-quizzes.service';
import { Roles } from '../auth/roles.decorator';

@Roles('ADMIN')
@Controller('admin')
export class AdminQuizzesController {
  constructor(private readonly service: AdminQuizzesService) {}

  @Get('quizzes')
  listQuizzes() {
    return this.service.listQuizzes();
  }

  @Get('quizzes/:id')
  getQuiz(@Param('id') id: string) {
    return this.service.getQuiz(id);
  }

  @Post('quizzes')
  createQuiz(@Body() body: any) {
    return this.service.createQuiz(body);
  }

  @Put('quizzes/:id')
  updateQuiz(@Param('id') id: string, @Body() body: any) {
    return this.service.updateQuiz(id, body);
  }

  @Delete('quizzes/:id')
  removeQuiz(@Param('id') id: string) {
    return this.service.removeQuiz(id);
  }

  @Get('quizzes/:id/analytics')
  analytics(@Param('id') id: string) {
    return this.service.analytics(id);
  }

  @Post('quizzes/:id/questions')
  addQuestion(@Param('id') id: string, @Body() body: any) {
    return this.service.addQuestion(id, body);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.service.updateQuestion(id, body);
  }

  @Delete('questions/:id')
  removeQuestion(@Param('id') id: string) {
    return this.service.removeQuestion(id);
  }

  @Patch('questions/:id/move')
  moveQuestion(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.service.moveQuestion(id, direction);
  }
}
