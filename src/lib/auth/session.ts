import { headers } from 'next/headers';
import { ACTOR_ID_HEADER, ACTOR_ROLE_HEADER, TENANT_HEADER } from '@/constants';
import type { Actor, Role } from '@/types';

/**
 * Resolve the authenticated Actor for the current server request.
 *
 * The middleware authenticates the request and forwards the principal as
 * request headers; here we read them back. This is the single place to swap in
 * a real auth provider (NextAuth/Clerk/custom JWT) later — nothing downstream
 * changes because everyone depends on the `Actor` shape, not the transport.
 *
 * NOTE: development fallback returns a SUPER_ADMIN so the app is runnable
 * before auth is wired. Remove/guard this before production.
 */
const VALID_ROLES: ReadonlySet<string> = new Set<Role>([
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'TENANT_STAFF',
]);

export async function getCurrentActor(): Promise<Actor | null> {
  const h = await headers();
  const id = h.get(ACTOR_ID_HEADER);
  const role = h.get(ACTOR_ROLE_HEADER);
  const tenantId = h.get(TENANT_HEADER);

  if (id && role && VALID_ROLES.has(role)) {
    return {
      id,
      role: role as Role,
      tenantId: tenantId && tenantId.length > 0 ? tenantId : null,
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    // Dev-only mock principal so Server Components/route handlers work.
    return { id: 'dev-super-admin', role: 'SUPER_ADMIN', tenantId: null };
  }

  return null;
}

/** Like `getCurrentActor` but throws when unauthenticated. */
export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) {
    throw new Error('UNAUTHENTICATED');
  }
  return actor;
}
