import type { NextRequest } from 'next/server';

import { tenantApi } from '@/modules/tenants/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const { id } = await params;
    return ok(await tenantApi.get(actor, id));
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
    return ok(await tenantApi.update(actor, id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.forbidden('Authentication required.');
    const { id } = await params;
    return ok(await tenantApi.archive(actor, id));
  } catch (error) {
    return fail(error);
  }
}
