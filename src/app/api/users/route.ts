import type { NextRequest } from 'next/server';

import { userApi } from '@/modules/users/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const sp = request.nextUrl.searchParams;
    return ok(
      await userApi.list(actor, {
        page: Number(sp.get('page') ?? 1),
        pageSize: Number(sp.get('pageSize') ?? 20),
        search: sp.get('search') ?? undefined,
        tenantId: sp.get('tenantId') ?? undefined,
      }),
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const body = await request.json();
    return ok(await userApi.create(actor, body), 201);
  } catch (error) {
    return fail(error);
  }
}
