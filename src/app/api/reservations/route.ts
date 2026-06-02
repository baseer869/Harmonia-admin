import type { NextRequest } from 'next/server';
import { reservationApi } from '@/modules/reservations/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const sp = request.nextUrl.searchParams;
    const status = sp.get('status') ?? undefined;
    return ok(await reservationApi.list(actor, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 20),
      status: status as never,
      tenantId: sp.get('tenantId') ?? undefined,
    }));
  } catch (error) {
    return fail(error);
  }
}
