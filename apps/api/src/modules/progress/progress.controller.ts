import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('me/progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  overview() {
    return this.service.overview();
  }
}
