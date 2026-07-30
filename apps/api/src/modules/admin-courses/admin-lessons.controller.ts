import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';

@Controller('admin/lessons')
export class AdminLessonsController {
  constructor(private readonly service: AdminCoursesService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.updateLesson(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.removeLesson(id);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.service.moveLesson(id, direction);
  }
}
