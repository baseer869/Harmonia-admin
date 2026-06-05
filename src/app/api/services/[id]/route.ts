import type { NextRequest } from 'next/server';

import { serviceApi } from '@/modules/services/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const { id } = await params;
    const locale = request.nextUrl.searchParams.get('locale') ?? undefined;
    return ok(await serviceApi.get(actor, id, locale));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const { id } = await params;
    const body = await request.json();
    return ok(await serviceApi.update(actor, id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const { id } = await params;
    await serviceApi.remove(actor, id);
    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
