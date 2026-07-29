import { Controller, Get, Param, Post } from '@nestjs/common';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly service: LessonsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }
}
