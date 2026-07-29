import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('home/highlights')
  homeHighlights() {
    return this.service.homeHighlights();
  }

  @Get('me/dashboard')
  userDashboard() {
    return this.service.userDashboard();
  }

  @Get('admin/stats/overview')
  adminOverview() {
    return this.service.adminOverview();
  }

  @Get('admin/stats/questions/most-missed')
  mostMissed() {
    return this.service.mostMissedQuestions();
  }
}
