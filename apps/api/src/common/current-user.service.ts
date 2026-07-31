import { ForbiddenException, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '@prisma/client';

/**
 * Restituisce l'utente autenticato per la richiesta corrente. L'utente viene risolto
 * e verificato da AuthGuard (vedi modules/auth/auth.guard.ts) e allegato a
 * request.user prima che qualunque controller/service venga eseguito — qui lo si
 * legge soltanto. Provider a scope REQUEST perché, a differenza di un singleton,
 * deve "vedere" una richiesta HTTP diversa (quindi un utente diverso) ad ogni chiamata.
 */
@Injectable({ scope: Scope.REQUEST })
export class CurrentUserService {
  constructor(@Inject(REQUEST) private readonly request: Request & { user?: User }) {}

  async getCurrentUser(): Promise<User> {
    if (!this.request.user) {
      throw new UnauthorizedException('Nessun utente autenticato per questa richiesta.');
    }
    return this.request.user;
  }

  /** Come getCurrentUser(), ma verifica esplicitamente il ruolo ADMIN (le rotte /admin/* sono comunque già protette da RolesGuard). */
  async getCurrentAdminUser(): Promise<User> {
    const user = await this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Richiesto ruolo amministratore.');
    }
    return user;
  }
}
