import { Global, Module } from '@nestjs/common';
import { XpEngineService } from './xp-engine.service';
import { BadgeEngineService } from './badge-engine.service';
import { StreakService } from './streak.service';
import { GamificationService } from './gamification.service';
import { LeaderboardService } from './leaderboard.service';
import { AdminGamificationService } from './admin-gamification.service';
import { GamificationController } from './gamification.controller';
import { AdminGamificationController } from './admin-gamification.controller';

/**
 * Globale perché XpEngineService/BadgeEngineService vengono richiamati da moduli
 * indipendenti (progress, quizzes, games) per assegnare XP/badge al completamento
 * di lezioni, quiz e mini giochi (docs/05 §5.5-5.6), senza dover importare
 * esplicitamente GamificationModule ovunque.
 */
@Global()
@Module({
  controllers: [GamificationController, AdminGamificationController],
  providers: [
    XpEngineService,
    BadgeEngineService,
    StreakService,
    GamificationService,
    LeaderboardService,
    AdminGamificationService,
  ],
  exports: [XpEngineService, BadgeEngineService],
})
export class GamificationModule {}
