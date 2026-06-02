import { cookies } from 'next/headers';

import { SESSION_COOKIE_ADMIN, SESSION_COOKIE_CUSTOMER } from '@/constants';
import type { SessionKind } from './jwt';

const NAME: Record<SessionKind, string> = {
  user: SESSION_COOKIE_ADMIN,
  customer: SESSION_COOKIE_CUSTOMER,
};

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches the JWT TTL

/**
 * Customer sessions may be set from the separate client origin, so they use
 * SameSite=None in production (requires Secure + CORS credentials). Admin
 * sessions are same-origin → Lax.
 */
export async function setSessionCookie(
  kind: SessionKind,
  token: string,
): Promise<void> {
  const jar = await cookies();
  const crossSite = kind === 'customer';
  jar.set(NAME[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(kind: SessionKind): Promise<void> {
  const jar = await cookies();
  jar.delete(NAME[kind]);
}

export async function readSessionCookie(
  kind: SessionKind,
): Promise<string | null> {
  const jar = await cookies();
  return jar.get(NAME[kind])?.value ?? null;
}
