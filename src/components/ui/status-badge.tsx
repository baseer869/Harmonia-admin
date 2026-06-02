import { cn } from '@/lib/utils';

type Tone = 'green' | 'red' | 'amber' | 'blue' | 'gray';

// Soft pastel pills (reference style): light tinted bg + saturated text.
const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  gray: 'bg-muted text-muted-foreground',
};

const MAP: Record<string, Tone> = {
  ACTIVE: 'green',
  CONFIRMED: 'blue',
  COMPLETED: 'blue',
  PAID: 'green',
  PUBLISHED: 'green',
  APPROVED: 'green',
  PENDING: 'amber',
  DRAFT: 'amber',
  SUSPENDED: 'amber',
  IN_PROGRESS: 'amber',
  CANCELLED: 'red',
  REJECTED: 'red',
  UNPAID: 'red',
  BLOCKED: 'red',
  FAILED: 'red',
  REFUNDED: 'gray',
  ARCHIVED: 'gray',
  INACTIVE: 'gray',
};

/** Soft, semantic status pill (Pending/Confirmed/Paid…). */
export function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const t = tone ?? MAP[status.toUpperCase()] ?? 'gray';
  const label =
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase().replace(/_/g, ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        TONES[t],
      )}
    >
      {label}
    </span>
  );
}
