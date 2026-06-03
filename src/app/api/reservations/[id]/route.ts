import type { NextRequest } from 'next/server';
import { reservationApi } from '@/modules/reservations/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const { id } = await params;
    return ok(await reservationApi.get(actor, id));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const { id } = await params;
    const body = await request.json();
    return ok(await reservationApi.updateStatus(actor, id, body));
  } catch (error) {
    return fail(error);
  }
}
