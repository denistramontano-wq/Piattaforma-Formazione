import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from './firebase-admin.provider';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
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

    let decoded;
    try {
      decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Sessione scaduta o token non valido, effettua di nuovo l\'accesso.');
    }

    request.user = await this.authService.resolveUser(decoded);
    return true;
  }
}
