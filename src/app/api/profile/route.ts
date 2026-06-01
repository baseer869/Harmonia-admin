import type { NextRequest } from 'next/server';

import { tenantApi } from '@/modules/tenants/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

/**
 * The acting tenant's OWN profile (self-service).
 *
 * Composes the tenants module's public API — the `settings` module owns the
 * tenant-facing profile experience but delegates persistence across a public
 * boundary rather than reaching into another module's internals.
 */
export async function GET() {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    return ok(await tenantApi.getCurrent(actor));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const body = await request.json();
    return ok(await tenantApi.updateProfile(actor, body));
  } catch (error) {
    return fail(error);
  }
}
