import { NextResponse, type NextRequest } from 'next/server';
import {
  ACTOR_ID_HEADER,
  ACTOR_ROLE_HEADER,
  TENANT_HEADER,
} from '@/constants';

/**
 * Edge proxy (Next 16's renamed `middleware`) — authentication + tenant
 * resolution.
 *
 * Responsibilities (admin app):
 *  1. Authenticate the request (placeholder: reads a session cookie).
 *  2. Resolve the acting principal (id, role) and active tenant.
 *  3. Forward them as request headers so Server Components / route handlers can
 *     rebuild the `Actor` via `lib/auth/getCurrentActor()`. Headers are the
 *     contract; the auth provider behind them can change freely.
 *
 * Tenant resolution for the ADMIN app:
 *  - SUPER_ADMIN: tenant is chosen explicitly per-action (e.g. via a tenant
 *    switcher that sets a cookie/query). No fixed tenant on the session.
 *  - TENANT_ADMIN / TENANT_STAFF: tenant is taken from their session claim.
 *  (The client/customer app resolves tenant from the host/subdomain instead.)
 *
 * This is intentionally a stub: replace the cookie parsing below with real
 * session verification (JWT/NextAuth/Clerk). The header-forwarding contract
 * should stay the same.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // --- Placeholder session extraction (REPLACE with real verification) ---
  const session = readSessionFromCookie(request);

  if (session) {
    requestHeaders.set(ACTOR_ID_HEADER, session.actorId);
    requestHeaders.set(ACTOR_ROLE_HEADER, session.role);
    // Active tenant: from the session, or from a tenant-switch cookie for
    // SUPER_ADMIN impersonation.
    const activeTenant =
      request.cookies.get('active_tenant')?.value ?? session.tenantId ?? '';
    if (activeTenant) requestHeaders.set(TENANT_HEADER, activeTenant);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

interface SessionClaim {
  actorId: string;
  role: string;
  tenantId?: string;
}

/** STUB: parse a signed session cookie. Returns null when unauthenticated. */
function readSessionFromCookie(request: NextRequest): SessionClaim | null {
  const raw = request.cookies.get('session')?.value;
  if (!raw) return null;
  try {
    // TODO: verify signature & decode a real token here.
    return JSON.parse(raw) as SessionClaim;
  } catch {
    return null;
  }
}

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
