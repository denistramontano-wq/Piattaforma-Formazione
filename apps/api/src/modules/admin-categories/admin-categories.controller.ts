import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly service: AdminCategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAllFlat();
  }

  @Post()
  create(@Body() body: { name: string; parentId?: string | null }) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; parentId?: string | null }) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
