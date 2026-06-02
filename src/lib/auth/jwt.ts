import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/types';

/**
 * Stateless session JWT (HS256) used for both admin users and customers.
 * `jose` is edge-compatible, so the same verify runs in the proxy and in
 * Server Components / route handlers.
 *
 * Refresh-token rotation is modeled in the DB (RefreshToken) for later; the
 * current session token is a 7-day signed JWT.
 */
export type SessionKind = 'user' | 'customer';

export interface SessionPayload {
  sub: string; // user.id or customer.id
  kind: SessionKind;
  role?: Role; // users only
  tenantId?: string | null;
  email?: string;
}

const TTL = '7d';

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set — required to sign/verify sessions.');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    kind: payload.kind,
    role: payload.role,
    tenantId: payload.tenantId ?? null,
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  return {
    sub: String(payload.sub),
    kind: payload.kind as SessionKind,
    role: payload.role as Role | undefined,
    tenantId: (payload.tenantId as string | null | undefined) ?? null,
    email: payload.email as string | undefined,
  };
}
