import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * L'autenticazione reale (JWT/OAuth2/SSO) è fuori dallo scope di questo scaffold
 * (capitolo 09 - Fondamenta). Finché non è collegata, tutte le rotte "personali"
 * operano sull'utente demo seedato dal database.
 */
export const DEMO_USER_EMAIL = 'maria.rossi@demo.piattaforma-formazione.it';
export const DEMO_ADMIN_EMAIL = 'admin@demo.piattaforma-formazione.it';

@Injectable()
export class CurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  getCurrentUser() {
    return this.prisma.user.findUniqueOrThrow({ where: { email: DEMO_USER_EMAIL } });
  }

  /**
   * Le rotte /admin/* agiscono come l'utente demo con ruolo ADMIN. Un vero controllo
   * RBAC (verifica ruolo + permessi sulla richiesta autenticata) è pianificato insieme
   * all'autenticazione reale — vedi docs/09-architettura-tecnica.md.
   */
  getCurrentAdminUser() {
    return this.prisma.user.findUniqueOrThrow({ where: { email: DEMO_ADMIN_EMAIL } });
  }
}
