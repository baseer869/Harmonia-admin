import type { NextRequest } from 'next/server';

import { serviceApi } from '@/modules/services/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

/** Route → Module API → Service → Repository (tenant-scoped) → DB. */
export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');

    const sp = request.nextUrl.searchParams;
    const result = await serviceApi.list(actor, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 20),
      search: sp.get('search') ?? undefined,
      tenantId: sp.get('tenantId') ?? undefined,
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
    // Super Admin may pass a target tenant; tenant roles ignore it.
    const { tenantId, ...input } = body ?? {};
    const service = await serviceApi.create(actor, input, tenantId);
    return ok(service, 201);
  } catch (error) {
    return fail(error);
  }
}
