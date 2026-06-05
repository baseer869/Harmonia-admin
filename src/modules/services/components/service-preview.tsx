'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  Calendar,
  Check,
  Clock,
  Languages,
  Pencil,
  Tag,
  Users,
} from 'lucide-react';

import { Button, Modal, StatusBadge } from '@/components/ui';
import { fromMinorUnits } from '@/constants';
import { useAdminI18n } from '@/lib/i18n/provider';

import type { Service } from '../types';

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
  const { t } = useAdminI18n();
  if (!service) return null;
  const s = service;

  const typeLabel: Record<Service['type'], string> = {
    EXPERIENCE: t.svcForm.tExperience,
    TRANSFER: t.svcForm.tTransfer,
    PRODUCT: t.svcForm.tProduct,
    QUOTE: t.svcForm.tQuote,
  };
  const modeLabel: Record<Service['priceMode'], string> = {
    PER_PERSON: t.svcForm.mPerPerson,
    PER_TRIP: t.svcForm.mPerTrip,
    FIXED: t.svcForm.mFixed,
    ON_QUOTE: t.svcForm.mOnQuote,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-title truncate">{s.title}</h2>
          <span className="bg-accent text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
            {typeLabel[s.type]}
          </span>
          <StatusBadge
            status={s.active ? t.common.active : t.common.hidden}
            tone={s.active ? 'green' : 'gray'}
          />
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t.common.close}
          </Button>
          <Button asChild>
            <Link href={`/services/${s.id}/edit` as Route}>
              <Pencil className="size-4" /> {t.svcForm.editTitle}
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
          {s.type === 'QUOTE' ? t.svcForm.onQuote : money(s.priceCents, s.currency)}
        </span>
        {s.type !== 'QUOTE' ? (
          <span className="text-muted-foreground text-sm">
            {s.priceUnit || modeLabel[s.priceMode]}
          </span>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Meta
          icon={Calendar}
          label={t.svcForm.requiresDate}
          value={s.requiresDate ? t.svcForm.yes : t.svcForm.no}
        />
        {s.maxPeople ? (
          <Meta icon={Users} label={t.svcForm.maxPeople} value={String(s.maxPeople)} />
        ) : null}
        {s.durationMinutes ? (
          <Meta
            icon={Clock}
            label={t.svcForm.duration}
            value={`${s.durationMinutes} min`}
          />
        ) : null}
        {s.languages.length ? (
          <Meta
            icon={Languages}
            label={t.svcForm.languages}
            value={s.languages.join(', ')}
          />
        ) : null}
      </div>

      {s.description ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">{t.svcForm.description}</h3>
          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
            {s.description}
          </p>
        </section>
      ) : null}

      {s.included.length ? (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">{t.svcForm.includedTitle}</h3>
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
          <h3 className="mb-2 text-sm font-semibold">{t.svcForm.optionsTitle}</h3>
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
          <h3 className="mb-2 text-sm font-semibold">{t.svcForm.extrasTitle}</h3>
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
          <h3 className="mb-2 text-sm font-semibold">{t.svcForm.practicalTitle}</h3>
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
          {s.tags.map((tag) => (
            <span
              key={tag}
              className="bg-accent text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
