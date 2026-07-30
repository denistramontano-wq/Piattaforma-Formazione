import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminGamificationService } from './admin-gamification.service';

@Controller('admin')
export class AdminGamificationController {
  constructor(private readonly service: AdminGamificationService) {}

  @Get('xp-rules')
  listXpRules() {
    return this.service.listXpRules();
  }

  @Put('xp-rules/:action')
  upsertXpRule(@Param('action') action: string, @Body() body: { points: number; description: string }) {
    return this.service.upsertXpRule(action, body.points, body.description);
  }

  @Get('badges')
  listBadges() {
    return this.service.listBadges();
  }

  @Get('badges/available-codes')
  availableCodes() {
    return this.service.availableBadgeCodes();
  }

  @Post('badges')
  createBadge(
    @Body() body: { code: string; name: string; criteriaDescription?: string; iconUrl?: string },
  ) {
    return this.service.createBadge(body);
  }

  @Put('badges/:id')
  updateBadge(
    @Param('id') id: string,
    @Body() body: { name?: string; criteriaDescription?: string; iconUrl?: string },
  ) {
    return this.service.updateBadge(id, body);
  }

  @Delete('badges/:id')
  removeBadge(@Param('id') id: string) {
    return this.service.removeBadge(id);
  }
}
