import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from './firebase-admin.provider';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      throw new UnauthorizedException('Accesso non autenticato: token mancante.');
    }

    // Separato dalla verifica del token qui sotto: un errore di CONFIGURAZIONE (credenziali
    // Firebase mancanti o non valide) è un problema del server, non dell'utente — va segnalato
    // in modo rumoroso (500 + log), non confuso con un token scaduto (401 silenzioso e atteso).
    let app;
    try {
      app = getFirebaseAdminApp();
    } catch (err) {
      this.logger.error(`Configurazione Firebase Admin non valida: ${(err as Error).message}`);
      throw new InternalServerErrorException('Configurazione del server non valida (Firebase Admin).');
    }

    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(token);
    } catch (err) {
      // "app-not-authorized"/credenziali non valide arrivano solo qui, non alla creazione
      // dell'app: le logghiamo per distinguerle da un normale token scaduto/non valido.
      const code = (err as { code?: string }).code;
      if (code && !['auth/id-token-expired', 'auth/argument-error', 'auth/invalid-id-token'].includes(code)) {
        this.logger.error(`Verifica token Firebase fallita (${code}): ${(err as Error).message}`);
      }
      throw new UnauthorizedException('Sessione scaduta o token non valido, effettua di nuovo l\'accesso.');
    }

    request.user = await this.authService.resolveUser(decoded);
    return true;
  }
}
