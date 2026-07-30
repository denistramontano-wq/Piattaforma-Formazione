import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KNOWN_BADGE_CODES } from './badge-engine.service';

@Injectable()
export class AdminGamificationService {
  constructor(private readonly prisma: PrismaService) {}

  listXpRules() {
    return this.prisma.xpRule.findMany({ orderBy: { action: 'asc' } });
  }

  upsertXpRule(action: string, points: number, description: string) {
    return this.prisma.xpRule.upsert({
      where: { action },
      update: { points, description },
      create: { action, points, description },
    });
  }

  async listBadges() {
    const badges = await this.prisma.badge.findMany({ orderBy: { name: 'asc' } });
    const knownCodes = new Set(KNOWN_BADGE_CODES.map((c) => c.code));
    return badges.map((b) => ({ ...b, hasAutoAwardRule: knownCodes.has(b.code) }));
  }

  availableBadgeCodes() {
    return KNOWN_BADGE_CODES;
  }

  createBadge(data: { code: string; name: string; criteriaDescription?: string; iconUrl?: string }) {
    return this.prisma.badge.create({ data });
  }

  updateBadge(id: string, data: { name?: string; criteriaDescription?: string; iconUrl?: string }) {
    return this.prisma.badge.update({ where: { id }, data });
  }

  removeBadge(id: string) {
    return this.prisma.badge.delete({ where: { id } });
  }
}
