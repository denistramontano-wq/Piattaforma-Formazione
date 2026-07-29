import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findAll({ category, level, tag, q });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post(':slug/enroll')
  enroll(@Param('slug') slug: string) {
    return this.service.enroll(slug);
  }
}
