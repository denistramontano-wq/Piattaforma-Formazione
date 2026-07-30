import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { StreakService } from './streak.service';
import { levelForXp } from './level-thresholds.util';

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly streak: StreakService,
  ) {}

  async myGamification() {
    const user = await this.currentUser.getCurrentUser();
    const streakResult = await this.streak.touch(user.id);

    const [userLevel, allBadges, myBadges, recentEvents] = await Promise.all([
      this.prisma.userLevel.findUnique({ where: { userId: user.id } }),
      this.prisma.badge.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.userBadge.findMany({ where: { userId: user.id } }),
      this.prisma.xpEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalXp = userLevel?.totalXp ?? 0;
    const info = levelForXp(totalXp);
    const earnedByBadgeId = new Map(myBadges.map((b) => [b.badgeId, b.earnedAt]));

    return {
      totalXp,
      level: info.level,
      levelName: info.name,
      currentLevelMinXp: info.minXp,
      nextLevelXp: info.nextLevelXp,
      progressPct: info.progressPct,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      badges: allBadges.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.criteriaDescription,
        iconUrl: b.iconUrl,
        earned: earnedByBadgeId.has(b.id),
        earnedAt: earnedByBadgeId.get(b.id) ?? null,
      })),
      recentActivity: recentEvents.map((e) => ({
        action: e.action,
        points: e.points,
        createdAt: e.createdAt,
      })),
    };
  }
}
