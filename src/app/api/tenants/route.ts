import type { NextRequest } from 'next/server';

import { tenantApi } from '@/modules/tenants/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

/**
 * Route layer (entry point). Resolves the Actor (transport concern), then
 * delegates to the module API. It does NOT touch the database, service or
 * repository directly — that boundary is enforced by eslint.
 *
 * Flow:  Route → Module API → Service → Repository → Database
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');

    const sp = request.nextUrl.searchParams;
    const result = await tenantApi.list(actor, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 20),
      search: sp.get('search') ?? undefined,
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');

    const body = await request.json();
    const tenant = await tenantApi.create(actor, body);
    return ok(tenant, 201);
  } catch (error) {
    return fail(error);
  }
}
