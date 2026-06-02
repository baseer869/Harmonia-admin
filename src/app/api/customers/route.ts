import type { NextRequest } from 'next/server';
import { customerApi } from '@/modules/customers/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const sp = request.nextUrl.searchParams;
    return ok(await customerApi.list(actor, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 20),
      search: sp.get('search') ?? undefined,
      tenantId: sp.get('tenantId') ?? undefined,
    }));
  } catch (error) {
    return fail(error);
  }
}
