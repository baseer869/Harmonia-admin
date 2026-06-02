import type { NextRequest } from 'next/server';

import { getCurrentActor } from '@/lib/auth';
import { saveUpload } from '@/lib/storage';
import { ApiError, fail, ok } from '@/lib/api';

/** Authenticated image upload → saved under public/uploads, returns its URL. */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw ApiError.badRequest('No file provided.');

    const result = await saveUpload(file);
    return ok(result, 201);
  } catch (error) {
    return fail(error);
  }
}
