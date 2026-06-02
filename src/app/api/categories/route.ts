import type { NextRequest } from 'next/server';
import { categoryApi } from '@/modules/categories/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const sp = request.nextUrl.searchParams;
    return ok(await categoryApi.list(actor, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 100),
      search: sp.get('search') ?? undefined,
      tenantId: sp.get('tenantId') ?? undefined,
    }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const body = await request.json();
    const { tenantId, ...input } = body ?? {};
    return ok(await categoryApi.create(actor, input, tenantId), 201);
  } catch (error) {
    return fail(error);
  }
}
