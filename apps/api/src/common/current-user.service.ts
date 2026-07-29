import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * L'autenticazione reale (JWT/OAuth2/SSO) è fuori dallo scope di questo scaffold
 * (capitolo 09 - Fondamenta). Finché non è collegata, tutte le rotte "personali"
 * operano sull'utente demo seedato dal database.
 */
export const DEMO_USER_EMAIL = 'maria.rossi@demo.piattaforma-formazione.it';

@Injectable()
export class CurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  getCurrentUser() {
    return this.prisma.user.findUniqueOrThrow({ where: { email: DEMO_USER_EMAIL } });
  }
}
