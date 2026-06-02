import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Local-disk file storage (dev/default).
 *
 * Files are written to `public/uploads/` so Next serves them statically at
 * `/uploads/<name>`. Swap `saveUpload` for an S3/GCS implementation in
 * production (the returned `url` is the only contract callers depend on).
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  size: number;
  contentType: string;
}

export async function saveUpload(file: File): Promise<UploadResult> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('No file provided.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File too large (max 5MB).');
  }
  const ext = (path.extname(file.name) || '.png').toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new Error('Unsupported file type.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  return { url: `/uploads/${name}`, size: file.size, contentType: file.type };
}
