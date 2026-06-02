import type { NextRequest } from 'next/server';

import { publicServiceApi } from '@/modules/services/server';
import { TENANT_SLUG_HEADER } from '@/constants';
import { ApiError, corsPreflight, fail, ok, withCors } from '@/lib/api';

export function OPTIONS() {
  return corsPreflight();
}

/** Public catalog list. Tenant resolved from the x-tenant-slug header (or ?tenant). */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const tenantSlug = request.headers.get(TENANT_SLUG_HEADER) ?? sp.get('tenant');
    if (!tenantSlug) throw ApiError.badRequest('Missing tenant.');

    const result = await publicServiceApi.list(tenantSlug, {
      page: Number(sp.get('page') ?? 1),
      pageSize: Number(sp.get('pageSize') ?? 50),
      search: sp.get('search') ?? undefined,
    });
    return withCors(ok(result));
  } catch (error) {
    return withCors(fail(error));
  }
}
