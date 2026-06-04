'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, Check } from 'lucide-react';

import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAdminI18n } from '@/lib/i18n/provider';

export interface WizardStep {
  id: string;
  label: string;
}

/**
 * Multi-step onboarding wizard: a step tab-strip + content card + Back/Next
 * footer (the "Add New Boat" pattern). Step state is controlled by the parent.
 */
export function Wizard({
  title,
  backHref,
  steps,
  current,
  onStepChange,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create',
  children,
}: {
  title: string;
  backHref: Route;
  steps: WizardStep[];
  current: number;
  onStepChange: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const { t } = useAdminI18n();
  const isLast = current === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="page-title">{title}</h1>
      </div>

      {/* Step tabs — themed top navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border bg-white p-1.5 shadow-sm">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => i <= current && onStepChange(i)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : done
                    ? 'text-foreground hover:bg-muted'
                    : 'text-muted-foreground cursor-default',
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full text-[11px]',
                  active
                    ? 'bg-white/25 text-primary-foreground'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted-foreground/20 text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-8">{children}</CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} disabled={current === 0 || isSubmitting}>
          {t.common.back}
        </Button>
        {isLast ? (
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? t.common.saving : submitLabel}
          </Button>
        ) : (
          <Button onClick={onNext}>{t.common.next}</Button>
        )}
      </div>
    </div>
  );
}
