import type { Actor } from '@/types';
import { readSessionCookie } from './cookies';
import { verifySession } from './jwt';

/**
 * Resolve the authenticated principal for the current server request by
 * verifying the signed session cookie. This is the single seam between the auth
 * transport (cookie + JWT) and the rest of the app, which only depends on the
 * `Actor` / `CustomerActor` shapes.
 */

export async function getCurrentActor(): Promise<Actor | null> {
  const token = await readSessionCookie('user');
  if (!token) return null;
  try {
    const p = await verifySession(token);
    if (p.kind !== 'user' || !p.role) return null;
    return {
      id: p.sub,
      role: p.role,
      tenantId: p.tenantId ?? null,
      email: p.email,
    };
  } catch {
    return null;
  }
}

export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('UNAUTHENTICATED');
  return actor;
}

/** Customer-facing principal (client website, /api/public/*). */
export interface CustomerActor {
  id: string;
  tenantId: string;
  email?: string;
}

export async function getCurrentCustomer(): Promise<CustomerActor | null> {
  const token = await readSessionCookie('customer');
  if (!token) return null;
  try {
    const p = await verifySession(token);
    if (p.kind !== 'customer' || !p.tenantId) return null;
    return { id: p.sub, tenantId: p.tenantId, email: p.email };
  } catch {
    return null;
  }
}
