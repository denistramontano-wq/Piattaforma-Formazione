import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  tree() {
    return this.service.findTree();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}
