import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async me() {
    const user = await this.currentUser.getCurrentUser();
    const [userLevel, badgeCount] = await Promise.all([
      this.prisma.userLevel.findUnique({ where: { userId: user.id } }),
      this.prisma.userBadge.count({ where: { userId: user.id } }),
    ]);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      level: userLevel?.currentLevel ?? 1,
      totalXp: userLevel?.totalXp ?? 0,
      badgeCount,
    };
  }

  async updateMe(data: { fullName?: string; avatarUrl?: string }) {
    const user = await this.currentUser.getCurrentUser();
    return this.prisma.user.update({ where: { id: user.id }, data });
  }
}
