import { Controller, Get, Query } from '@nestjs/common';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly service: DownloadsService) {}

  @Get()
  findAll(@Query('type') type?: string, @Query('category') category?: string) {
    return this.service.findAll(type, category);
  }
}
