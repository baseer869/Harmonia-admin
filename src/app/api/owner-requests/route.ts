import type { NextRequest } from 'next/server';

import { ownerRequestApi } from '@/modules/owner-requests/server';
import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';
import type { OwnerRequestStatus } from '@/modules/owner-requests/server';

export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    const sp = request.nextUrl.searchParams;
    return ok(
      await ownerRequestApi.list(actor, {
        page: Number(sp.get('page') ?? 1),
        pageSize: Number(sp.get('pageSize') ?? 20),
        status: (sp.get('status') as OwnerRequestStatus | null) ?? undefined,
        search: sp.get('search') ?? undefined,
      }),
    );
  } catch (error) {
    return fail(error);
  }
}
