import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Le regole di assegnazione badge (docs/05 §5.2) sono predicati verificabili sui dati
 * dell'utente, non esprimibili in modo sicuro come dati puramente configurabili senza
 * un motore di regole dedicato (fuori scope qui, come le regole XP restano invece
 * data-driven in tabella). Ogni badge seedato ha un `code` stabile collegato a uno di
 * questi controlli; badge creati da admin con un codice sconosciuto restano validi come
 * riconoscimento ma non vengono mai assegnati automaticamente (l'UI admin lo segnala).
 */
export const KNOWN_BADGE_CODES: { code: string; label: string }[] = [
  { code: 'PRIMO_CORSO', label: 'Primo corso completato' },
  { code: 'STREAK_7', label: '7 giorni di fila' },
  { code: 'QUIZ_PERFETTO', label: '100% su un quiz difficile' },
  { code: 'ESPLORATORE_GIOCHI', label: 'Almeno 3 mini giochi diversi giocati' },
];

type BadgeCheck = (userId: string, prisma: PrismaService) => Promise<boolean>;

const CHECKS: Record<string, BadgeCheck> = {
  PRIMO_CORSO: async (userId, prisma) =>
    (await prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } })) >= 1,

  STREAK_7: async (userId, prisma) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return user.currentStreak >= 7;
  },

  QUIZ_PERFETTO: async (userId, prisma) =>
    (await prisma.quizAttempt.count({
      where: { userId, scorePct: 100, quiz: { level: 'AVANZATO' } },
    })) >= 1,

  ESPLORATORE_GIOCHI: async (userId, prisma) => {
    const distinctGames = await prisma.gameSession.findMany({
      where: { userId },
      distinct: ['gameId'],
      select: { gameId: true },
    });
    return distinctGames.length >= 3;
  },
};

@Injectable()
export class BadgeEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /** Valuta tutti i badge non ancora ottenuti dall'utente e assegna quelli le cui condizioni sono soddisfatte. */
  async evaluate(userId: string): Promise<string[]> {
    const [badges, owned] = await Promise.all([
      this.prisma.badge.findMany(),
      this.prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    ]);
    const ownedIds = new Set(owned.map((b) => b.badgeId));
    const newlyAwarded: string[] = [];

    for (const badge of badges) {
      if (ownedIds.has(badge.id)) continue;
      const check = CHECKS[badge.code];
      if (!check) continue;
      if (await check(userId, this.prisma)) {
        await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        newlyAwarded.push(badge.name);
      }
    }
    return newlyAwarded;
  }
}
