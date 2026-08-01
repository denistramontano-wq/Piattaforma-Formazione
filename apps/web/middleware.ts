import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

const PUBLIC_PATHS = ['/login', '/certificates/verify'];

/**
 * Controllo "ottimistico": verifica solo che il cookie esista, non lo convalida (la
 * convalida reale del token avviene ad ogni chiamata API lato NestJS). Serve solo a
 * evitare che un Server Component provi a fare fetch senza sessione e mostri una
 * pagina di errore invece di rimandare al login.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|logo-atm-mark.png|api/session).*)'],
};
