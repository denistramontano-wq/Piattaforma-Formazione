import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { XpEngineService } from '../gamification/xp-engine.service';
import { BadgeEngineService } from '../gamification/badge-engine.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly xpEngine: XpEngineService,
    private readonly badgeEngine: BadgeEngineService,
  ) {}

  findAll() {
    return this.prisma.miniGame.findMany();
  }

  findOne(id: string) {
    return this.prisma.miniGame.findUniqueOrThrow({ where: { id } });
  }

  async completeSession(id: string, score: number, durationSeconds: number) {
    const user = await this.currentUser.getCurrentUser();
    const session = await this.prisma.gameSession.create({
      data: { gameId: id, userId: user.id, score, durationSeconds },
    });
    await this.xpEngine.award(user.id, 'GAME_COMPLETED', { refType: 'MiniGame', refId: id });
    await this.badgeEngine.evaluate(user.id);
    return session;
  }
}
