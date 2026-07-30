import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { levelForXp } from './level-thresholds.util';

export interface XpAwardResult {
  action: string;
  points: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
}

@Injectable()
export class XpEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /** Assegna XP per un'azione configurata in XpRule. Nessun effetto se l'azione non ha una regola o vale 0 punti. */
  async award(
    userId: string,
    action: string,
    ref?: { refType: string; refId: string },
  ): Promise<XpAwardResult | null> {
    const rule = await this.prisma.xpRule.findUnique({ where: { action } });
    if (!rule || rule.points <= 0) return null;
    return this.grant(userId, action, rule.points, ref);
  }

  /** Assegna un numero di punti esplicito, bypassando la tabella XpRule (usato dalla streak giornaliera). */
  async grant(
    userId: string,
    action: string,
    points: number,
    ref?: { refType: string; refId: string },
  ): Promise<XpAwardResult> {
    await this.prisma.xpEvent.create({
      data: { userId, action, points, refType: ref?.refType, refId: ref?.refId },
    });
    const previous = await this.prisma.userLevel.findUnique({ where: { userId } });
    const userLevel = await this.prisma.userLevel.upsert({
      where: { userId },
      update: { totalXp: { increment: points } },
      create: { userId, totalXp: points, currentLevel: 1 },
    });
    const info = levelForXp(userLevel.totalXp);
    const leveledUp = info.level > (previous?.currentLevel ?? 1);
    if (info.level !== userLevel.currentLevel) {
      await this.prisma.userLevel.update({ where: { userId }, data: { currentLevel: info.level } });
    }
    return {
      action,
      points,
      totalXp: userLevel.totalXp,
      level: info.level,
      levelName: info.name,
      leveledUp,
    };
  }
}
