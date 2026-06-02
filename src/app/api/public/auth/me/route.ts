import { getCurrentCustomer } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

/** Current customer principal (or 401). */
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) throw ApiError.unauthorized();
    return ok(customer);
  } catch (error) {
    return fail(error);
  }
}
