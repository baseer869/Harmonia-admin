import type { NextRequest } from 'next/server';

import { authApi } from '@/modules/auth/server';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

/** Back-office login → verify credentials, set the admin session cookie. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, principal } = await authApi.adminLogin(body);
    await setSessionCookie('user', token);
    return ok(principal);
  } catch (error) {
    return fail(error);
  }
}
