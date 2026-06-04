/**
 * Free machine translation via Google's unauthenticated `gtx` endpoint
 * (no API key, no billing). Best-effort drafting — the admin always reviews/
 * edits the result. On any failure the original text is returned unchanged.
 */
const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

async function translateOne(text: string, to: string, from = 'auto'): Promise<string> {
  if (!text || !text.trim()) return text ?? '';
  try {
    const url = `${ENDPOINT}?client=gtx&sl=${from}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return text;
    const data = (await res.json()) as unknown;
    const segs = Array.isArray(data) && Array.isArray((data as unknown[])[0])
      ? ((data as unknown[][])[0] as unknown[][])
      : [];
    const out = segs.map((s) => (Array.isArray(s) ? String(s[0] ?? '') : '')).join('');
    return out || text;
  } catch {
    return text;
  }
}

/** Translate many short strings to `to` (source auto-detected). */
export async function translateBatch(texts: string[], to: string): Promise<string[]> {
  return Promise.all(texts.map((t) => translateOne(t, to)));
}
