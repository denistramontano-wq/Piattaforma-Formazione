import { Controller, Get, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { LeaderboardService, LeaderboardPeriod } from './leaderboard.service';

@Controller()
export class GamificationController {
  constructor(
    private readonly gamification: GamificationService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  @Get('me/gamification')
  myGamification() {
    return this.gamification.myGamification();
  }

  @Get('leaderboard')
  leaderboardGet(@Query('period') period?: string) {
    const validPeriods: LeaderboardPeriod[] = ['weekly', 'monthly', 'alltime'];
    const p = (validPeriods as string[]).includes(period ?? '') ? (period as LeaderboardPeriod) : 'alltime';
    return this.leaderboard.leaderboard(p);
  }
}
