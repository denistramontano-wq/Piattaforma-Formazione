import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface Row {
  userId: string;
  points: number;
  fullName: string;
  avatarUrl: string | null;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async leaderboard(period: LeaderboardPeriod = 'alltime', limit = 20) {
    const rows = period === 'alltime' ? await this.allTimeRows(limit) : await this.periodRows(period, limit);
    const me = await this.currentUser.getCurrentUser();

    return {
      period,
      entries: rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        fullName: r.fullName,
        avatarUrl: r.avatarUrl,
        points: r.points,
        isCurrentUser: r.userId === me.id,
      })),
    };
  }

  private async allTimeRows(limit: number): Promise<Row[]> {
    const levels = await this.prisma.userLevel.findMany({
      orderBy: { totalXp: 'desc' },
      take: limit,
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
    return levels.map((l) => ({
      userId: l.userId,
      points: l.totalXp,
      fullName: l.user.fullName,
      avatarUrl: l.user.avatarUrl,
    }));
  }

  private async periodRows(period: 'weekly' | 'monthly', limit: number): Promise<Row[]> {
    const days = period === 'weekly' ? 7 : 30;
    const since = new Date(Date.now() - days * ONE_DAY_MS);

    const grouped = await this.prisma.xpEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, fullName: true, avatarUrl: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return grouped
      .map((g) => {
        const u = byId.get(g.userId);
        return {
          userId: g.userId,
          points: g._sum.points ?? 0,
          fullName: u?.fullName ?? '—',
          avatarUrl: u?.avatarUrl ?? null,
        };
      })
      .filter((r) => r.points > 0);
  }
}
