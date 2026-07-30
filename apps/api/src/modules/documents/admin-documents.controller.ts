import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminDocumentsService } from './admin-documents.service';

@Controller('admin/documents')
export class AdminDocumentsController {
  constructor(private readonly service: AdminDocumentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    const { fileUrl, ...meta } = body;
    return this.service.create(meta, fileUrl);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Post(':id/versions')
  addVersion(@Param('id') id: string, @Body() body: { fileUrl: string; changelog?: string }) {
    return this.service.addVersion(id, body.fileUrl, body.changelog);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
