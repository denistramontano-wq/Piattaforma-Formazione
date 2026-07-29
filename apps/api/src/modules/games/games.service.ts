import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  findAll() {
    return this.prisma.miniGame.findMany();
  }

  findOne(id: string) {
    return this.prisma.miniGame.findUniqueOrThrow({ where: { id } });
  }

  async completeSession(id: string, score: number, durationSeconds: number) {
    const user = await this.currentUser.getCurrentUser();
    return this.prisma.gameSession.create({
      data: { gameId: id, userId: user.id, score, durationSeconds },
    });
  }
}
