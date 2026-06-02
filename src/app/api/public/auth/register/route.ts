import type { NextRequest } from 'next/server';

import { authApi } from '@/modules/auth/server';
import { setSessionCookie } from '@/lib/auth';
import { TENANT_SLUG_HEADER } from '@/constants';
import { fail, ok } from '@/lib/api';

/** Public customer registration. Tenant comes from body or x-tenant-slug header. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantSlug = body?.tenantSlug ?? request.headers.get(TENANT_SLUG_HEADER);
    const { token, principal } = await authApi.customerRegister({
      ...body,
      tenantSlug,
    });
    await setSessionCookie('customer', token);
    return ok(principal, 201);
  } catch (error) {
    return fail(error);
  }
}
