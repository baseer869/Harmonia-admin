'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Solid-black back affordance shown beside a page title. Navigates to an
 * explicit `href` when given, otherwise steps back in history.
 */
export function BackButton({ href }: { href?: Route }) {
  const router = useRouter();

  const className =
    'grid size-9 shrink-0 place-items-center rounded-lg text-black transition-colors hover:bg-black/5';

  if (href) {
    return (
      <Link href={href} aria-label="Back" className={className}>
        <ArrowLeft className="size-6" strokeWidth={2.5} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className={className}
    >
      <ArrowLeft className="size-6" strokeWidth={2.5} />
    </button>
  );
}
