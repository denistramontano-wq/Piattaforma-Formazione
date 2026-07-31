import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Globale: applica AuthGuard (autenticazione Firebase) e RolesGuard (controllo ruoli
 * via @Roles()) a tutte le rotte dell'app, salvo quelle marcate @Public() (vedi
 * public.decorator.ts — usato ad es. per /health).
 */
@Global()
@Module({
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
