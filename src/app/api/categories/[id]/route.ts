import type { NextRequest } from 'next/server';
import { categoryApi } from '@/modules/categories/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const { id } = await params;
    const body = await request.json();
    return ok(await categoryApi.update(actor, id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const { id } = await params;
    await categoryApi.remove(actor, id);
    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
