import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/sessions')
  complete(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('durationSeconds') durationSeconds: number,
  ) {
    return this.service.completeSession(id, score ?? 0, durationSeconds ?? 0);
  }
}
