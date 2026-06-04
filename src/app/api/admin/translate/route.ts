import type { NextRequest } from 'next/server';

import { getCurrentActor } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { ApiError, fail, ok } from '@/lib/api';

/** Authenticated machine-translation draft (free Google endpoint). */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentActor();
    if (!actor) throw ApiError.unauthorized();

    const body = (await request.json()) as { texts?: unknown; to?: unknown };
    const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t ?? '')) : [];
    const to = typeof body.to === 'string' ? body.to : '';
    if (!to) throw ApiError.badRequest('Missing target language.');
    if (texts.length === 0) return ok({ translations: [] });

    const translations = await translateBatch(texts, to);
    return ok({ translations });
  } catch (error) {
    return fail(error);
  }
}
