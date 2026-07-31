import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

/**
 * Sincronizza il token Firebase (ottenuto lato client) in un cookie httpOnly, così che i
 * Server Component — che girano sul server e non hanno accesso all'SDK Firebase del
 * browser — possano leggerlo e inoltrarlo come Authorization header verso l'API (vedi
 * lib/api.ts). La verifica del token avviene comunque sempre lato NestJS ad ogni
 * chiamata: questo endpoint si limita a spostarlo, non lo convalida.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'idToken mancante' }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
