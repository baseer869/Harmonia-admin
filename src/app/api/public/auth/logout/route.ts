import { clearSessionCookie } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

export async function POST() {
  try {
    await clearSessionCookie('customer');
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
