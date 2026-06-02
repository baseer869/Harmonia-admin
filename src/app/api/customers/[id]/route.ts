import type { NextRequest } from 'next/server';
import { customerApi } from '@/modules/customers/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const { id } = await params;
    const body = await request.json();
    return ok(await customerApi.setStatus(actor, id, body.status));
  } catch (error) {
    return fail(error);
  }
}
