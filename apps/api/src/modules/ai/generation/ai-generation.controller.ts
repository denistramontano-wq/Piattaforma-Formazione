import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { AiUsageService } from '../ai-usage.service';

@Controller('admin/ai')
export class AiGenerationController {
  constructor(
    private readonly service: AiGenerationService,
    private readonly usage: AiUsageService,
  ) {}

  @Get('sources')
  sources() {
    return this.service.listSources();
  }

  @Get('generations')
  findAll(@Query('reviewStatus') reviewStatus?: string) {
    return this.service.findAll(reviewStatus);
  }

  @Get('generations/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('generate')
  generate(@Body() body: { sourceType: 'DOCUMENT' | 'LESSON'; sourceId: string; generationType: string }) {
    return this.service.generate(body.sourceType, body.sourceId, body.generationType as any);
  }

  @Post('generations/:id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post('generations/:id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Get('usage')
  usageSummary() {
    return this.usage.summary();
  }
}
