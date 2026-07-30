import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XpEngineService } from './xp-engine.service';
import { BadgeEngineService } from './badge-engine.service';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  touchedToday: boolean;
}

/**
 * Non esiste ancora un sistema di login/sessione reale (docs/09), quindi la "streak
 * giornaliera di accesso" (docs/05 §5.2) usa come proxy qualunque chiamata autenticata
 * che tocca questo servizio (apertura della pagina gamification, completamento lezione/
 * quiz/gioco): un'approssimazione ragionevole finché l'autenticazione reale non è collegata.
 */
@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpEngine: XpEngineService,
    private readonly badgeEngine: BadgeEngineService,
  ) {}

  async touch(userId: string): Promise<StreakResult> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = startOfDay(new Date());
    const last = user.lastActiveDate ? startOfDay(user.lastActiveDate) : null;

    if (last && last.getTime() === today.getTime()) {
      return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, touchedToday: false };
    }

    const isConsecutive = last !== null && today.getTime() - last.getTime() === ONE_DAY_MS;
    const currentStreak = isConsecutive ? user.currentStreak + 1 : 1;
    const longestStreak = Math.max(user.longestStreak, currentStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveDate: today, currentStreak, longestStreak },
    });

    const rule = await this.prisma.xpRule.findUnique({ where: { action: 'DAILY_STREAK' } });
    if (rule && rule.points > 0) {
      await this.xpEngine.grant(userId, 'DAILY_STREAK', rule.points);
    }
    await this.badgeEngine.evaluate(userId);

    return { currentStreak, longestStreak, touchedToday: true };
  }
}
