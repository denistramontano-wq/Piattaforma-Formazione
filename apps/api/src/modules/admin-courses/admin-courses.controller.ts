import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';
import { Roles } from '../auth/roles.decorator';

@Roles('ADMIN')
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly service: AdminCoursesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: string; publishAt?: string }) {
    return this.service.setStatus(id, body.status, body.publishAt);
  }

  @Post(':id/modules')
  createModule(@Param('id') id: string, @Body('title') title: string) {
    return this.service.createModule(id, title);
  }
}
