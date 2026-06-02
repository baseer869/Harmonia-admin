import { getCurrentActor } from '@/lib/auth';
import { ApiError, fail, ok } from '@/lib/api';

/** Current back-office principal (or 401). */
export async function GET() {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();
    return ok(actor);
  } catch (error) {
    return fail(error);
  }
}
