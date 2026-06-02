'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  Calendar,
  Check,
  Clock,
  Languages,
  Pencil,
  Star,
  Tag,
  Users,
} from 'lucide-react';

import { Button, Modal, StatusBadge } from '@/components/ui';
import { fromMinorUnits } from '@/constants';

import type { Service } from '../types';

const TYPE_LABEL: Record<Service['type'], string> = {
  EXPERIENCE: 'Experience',
  TRANSFER: 'Transfer',
  PRODUCT: 'Product',
  QUOTE: 'On quote',
};

const MODE_LABEL: Record<Service['priceMode'], string> = {
  PER_PERSON: 'per person',
  PER_TRIP: 'per trip',
  FIXED: 'fixed',
  ON_QUOTE: 'on quote',
};

function money(cents: number, currency: string): string {
  return `${fromMinorUnits(cents, currency).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

/** Read-only service preview shown when clicking the eye action in the catalog. */
export function ServicePreview({
  service,
  open,
  onClose,
}: {
  service: Service | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!service) return null;
  const s = service;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-title truncate">{s.title}</h2>
          <span className="bg-accent text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
            {TYPE_LABEL[s.type]}
          </span>
          <StatusBadge
            status={s.active ? 'Active' : 'Hidden'}
            tone={s.active ? 'green' : 'gray'}
          />
          {s.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <Star className="size-3 fill-current" /> Featured
            </span>
          ) : null}
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild>
            <Link href={`/services/${s.id}/edit` as Route}>
              <Pencil className="size-4" /> Edit service
            </Link>
          </Button>
        </>
      }
    >
      {s.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.coverUrl}
          alt={s.title}
          className="mb-5 h-48 w-full rounded-lg object-cover"
        />
      ) : null}

      {s.subtitle ? (
        <p className="text-muted-foreground mb-4 text-sm">{s.subtitle}</p>
      ) : null}

      <div className="bg-accent/40 mb-5 flex flex-wrap items-baseline gap-x-2 rounded-lg px-4 py-3">
        <span className="text-2xl font-semibold">
          {s.type === 'QUOTE' ? 'On request' : money(s.priceCents, s.currency)}
        </span>
        {s.type !== 'QUOTE' ? (
          <span className="text-muted-foreground text-sm">
            {s.priceUnit || MODE_LABEL[s.priceMode]}
          </span>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Meta
          icon={Calendar}
          label="Date required"
          value={s.requiresDate ? 'Yes' : 'No'}
        />
        {s.maxPeople ? (
          <Meta icon={Users} label="Max people" value={String(s.maxPeople)} />
        ) : null}
        {s.durationMinutes ? (
          <Meta
            icon={Clock}
            label="Duration"
            value={`${s.durationMinutes} min`}
          />
        ) : null}
        {s.languages.length ? (
          <Meta
            icon={Languages}
            label="Languages"
            value={s.languages.join(', ')}
          />
        ) : null}
      </div>

      {s.description ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">Description</h3>
          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
            {s.description}
          </p>
        </section>
      ) : null}

      {s.included.length ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">What&apos;s included</h3>
          <ul className="space-y-2">
            {s.included.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-medium">{i.title}</span>
                  {i.description ? (
                    <span className="text-muted-foreground"> — {i.description}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {s.options.length ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">Options</h3>
          <div className="divide-y rounded-lg border">
            {s.options.map((o, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{o.name}</span>
                <span className="text-muted-foreground">
                  {o.priceDeltaCents >= 0 ? '+' : ''}
                  {money(o.priceDeltaCents, s.currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {s.extras.length ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">Add-ons</h3>
          <div className="divide-y rounded-lg border">
            {s.extras.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{e.name}</span>
                <span className="text-muted-foreground">
                  {money(e.priceCents, s.currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {s.info.length ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">Good to know</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {s.info.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{i.label}</dt>
                <dd className="text-right font-medium">{i.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {s.tags.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="text-muted-foreground size-4" />
          {s.tags.map((t) => (
            <span
              key={t}
              className="bg-accent text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
