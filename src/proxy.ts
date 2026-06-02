import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_ADMIN } from '@/constants';

/**
 * Edge proxy (Next 16's renamed `middleware`) — back-office auth guard.
 *
 * Lightweight gate: if there is no admin session cookie, redirect page
 * requests to /login. Full JWT verification happens server-side in
 * `getCurrentActor()` (and API routes return 401 themselves). This keeps the
 * edge cheap while the (admin) layout double-checks the verified actor.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_ADMIN);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Guard everything except the login page, API routes, and static assets.
  matcher: [
    '/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
