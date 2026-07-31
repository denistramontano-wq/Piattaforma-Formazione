import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';
import { Roles } from '../auth/roles.decorator';

@Roles('ADMIN')
@Controller('admin/modules')
export class AdminModulesController {
  constructor(private readonly service: AdminCoursesService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body('title') title: string) {
    return this.service.updateModule(id, title);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.removeModule(id);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.service.moveModule(id, direction);
  }

  @Post(':id/lessons')
  createLesson(@Param('id') id: string, @Body() body: any) {
    return this.service.createLesson(id, body);
  }
}
