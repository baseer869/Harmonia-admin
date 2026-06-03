'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Resize a picked image to a max dimension and re-encode as JPEG before upload.
 * Keeps the request (and any data-URL fallback) small — well under serverless
 * body limits — and avoids huge originals. SVG/GIF pass through untouched.
 */
async function compressImage(file: File, maxDim: number, quality = 0.82): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Image upload with inline preview. Saves via /api/admin/upload, returns a URL. */
export function ImageUpload({
  value,
  onChange,
  variant = 'logo',
  label,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  variant?: 'logo' | 'cover';
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file, variant === 'cover' ? 1600 : 600);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Upload failed');
      onChange(json.data.url as string);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-foreground block text-[13px] font-semibold">{label}</label>
      ) : null}
      <div
        className={cn(
          'bg-muted/40 relative overflow-hidden rounded-lg border border-dashed',
          variant === 'cover' ? 'aspect-[16/5] w-full' : 'size-28',
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-background/90 text-foreground hover:bg-background absolute top-2 right-2 grid size-7 place-items-center rounded-full border shadow-sm"
              aria-label="Remove"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={pick}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/40 flex h-full w-full flex-col items-center justify-center gap-1.5 transition-colors"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-xs">{uploading ? 'Uploading…' : 'Upload image'}</span>
          </button>
        )}
      </div>
      {value ? (
        <button type="button" onClick={pick} className="text-primary text-xs font-medium">
          {uploading ? 'Uploading…' : 'Replace'}
        </button>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
