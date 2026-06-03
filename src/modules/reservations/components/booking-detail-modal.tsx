'use client';

import { Calendar, Check, Mail, MapPin, Phone, User, X } from 'lucide-react';

import { Button, Modal, StatusBadge } from '@/components/ui';
import { fromMinorUnits } from '@/constants';

import { useReservation, useUpdateReservationStatus } from '../hooks';
import type { ReservationStatus } from '../types';

function money(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

/** Read-only booking detail shown when clicking the eye action in the list. */
export function BookingDetailModal({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useReservation(id ?? undefined);
  const update = useUpdateReservationStatus(id ?? '');

  const act = (status: ReservationStatus) => update.mutate(status);

  // Allowed transitions per current status.
  const actions: { label: string; to: ReservationStatus; icon: typeof Check; variant: 'default' | 'outline' | 'destructive' }[] =
    data?.status === 'PENDING'
      ? [
          { label: 'Approve', to: 'CONFIRMED', icon: Check, variant: 'default' },
          { label: 'Reject', to: 'CANCELLED', icon: X, variant: 'destructive' },
        ]
      : data?.status === 'CONFIRMED'
        ? [
            { label: 'Mark completed', to: 'COMPLETED', icon: Check, variant: 'default' },
            { label: 'Cancel', to: 'CANCELLED', icon: X, variant: 'destructive' },
          ]
        : [];

  const footer =
    data && actions.length ? (
      <div className="flex flex-1 items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          {update.isError ? (update.error as Error).message : 'Update the booking status'}
        </span>
        <div className="flex gap-2">
          {actions.map((a) => (
            <Button
              key={a.to}
              variant={a.variant}
              onClick={() => act(a.to)}
              disabled={update.isPending}
            >
              <a.icon className="size-4" />
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      footer={footer}
      title={
        data ? (
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="section-title font-mono">{data.code}</h2>
            <StatusBadge status={data.status} />
          </div>
        ) : (
          'Booking'
        )
      }
    >
      {isLoading && <p className="text-muted-foreground text-sm">Loading booking…</p>}
      {isError && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      {data && (
        <div className="space-y-6">
          {/* Customer */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Customer</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info icon={User} label="Name" value={data.customerName || '—'} />
              <Info icon={Mail} label="Email" value={data.customerEmail || '—'} />
              <Info icon={Phone} label="Phone" value={data.customerPhone || '—'} />
              <Info icon={MapPin} label="City" value={data.customerCity || '—'} />
            </div>
          </section>

          {/* Schedule */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info icon={Calendar} label="Scheduled" value={fmtDate(data.scheduledAt)} />
            <Info icon={Calendar} label="Booked on" value={fmtDate(data.createdAt)} />
          </section>

          {/* Items */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Items ({data.itemsCount})</h3>
            <div className="divide-y rounded-lg border">
              {data.items.map((it, idx) => (
                <div key={idx} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {it.title} <span className="text-muted-foreground">× {it.quantity}</span>
                    </span>
                    <span className="text-sm">
                      {money(it.unitPriceCents * it.quantity, data.currency)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                    <span>Unit {money(it.unitPriceCents, data.currency)}</span>
                    {it.scheduledAt && <span>{fmtDate(it.scheduledAt)}</span>}
                    {it.extras.map((e) => (
                      <span key={e.name}>
                        + {e.name} ({money(e.priceCents, data.currency)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {data.notes && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Notes</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-line">{data.notes}</p>
            </section>
          )}

          {/* Totals */}
          <section className="ml-auto max-w-xs space-y-1.5">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{money(data.subtotalCents, data.currency)}</span>
            </div>
            {data.discountCents > 0 && (
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>Discount</span>
                <span>− {money(data.discountCents, data.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
              <span>Total</span>
              <span>{money(data.totalCents, data.currency)}</span>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
