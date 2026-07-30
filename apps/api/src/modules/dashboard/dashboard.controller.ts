import { Controller, Get, Query } from '@nestjs/common';
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

  @Get('me/activity-log')
  activityLog() {
    return this.service.myActivityLog();
  }

  @Get('admin/stats/overview')
  adminOverview() {
    return this.service.adminOverview();
  }

  @Get('admin/stats/courses')
  courseStats() {
    return this.service.courseStats();
  }

  @Get('admin/stats/questions/most-missed')
  mostMissed() {
    return this.service.mostMissedQuestions();
  }

  @Get('admin/users/inactive')
  inactiveUsers(@Query('days') days?: string) {
    const parsed = Number(days);
    return this.service.inactiveUsers(Number.isFinite(parsed) && parsed > 0 ? parsed : 30);
  }
}
