import type { NextRequest } from 'next/server';

import { publicServiceApi } from '@/modules/services/server';
import { TENANT_SLUG_HEADER } from '@/constants';
import { ApiError, corsPreflight, fail, ok, withCors } from '@/lib/api';

type Context = { params: Promise<{ slug: string }> };

export function OPTIONS() {
  return corsPreflight();
}

/** Public service detail by slug. */
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const tenantSlug =
      request.headers.get(TENANT_SLUG_HEADER) ?? request.nextUrl.searchParams.get('tenant');
    if (!tenantSlug) throw ApiError.badRequest('Missing tenant.');
    const { slug } = await params;
    return withCors(ok(await publicServiceApi.getBySlug(tenantSlug, slug)));
  } catch (error) {
    return withCors(fail(error));
  }
}
