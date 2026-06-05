'use client';

import { Modal } from '@/components/ui';
import { useAdminI18n } from '@/lib/i18n/provider';

import type { OwnerRequest } from '../types';

/** Read-only detail of a single provider request (full message + contact). */
export function OwnerRequestDetail({
  request,
  open,
  onClose,
}: {
  request: OwnerRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  if (!request) return null;
  const r = request;

  const rows: [string, string][] = [
    [t.common.name, `${r.firstName} ${r.lastName ?? ''}`.trim()],
    [t.common.email, r.email],
    [t.common.phone, r.phone ?? '—'],
    [t.ownerReq.business ?? 'Business', r.company ?? '—'],
    [t.ownerReq.role ?? 'Role', r.role ?? '—'],
    [t.ownerReq.subject ?? 'Subject', r.subject ?? '—'],
    [t.ownerReq.requestedOn ?? 'Requested on', new Date(r.createdAt).toLocaleString()],
  ];

  return (
    <Modal open={open} onClose={onClose} size="lg" title={t.ownerReq.detailTitle ?? 'Provider request'}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-muted-foreground text-xs">{k}</p>
              <p className="text-sm font-medium break-words">{v}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">{t.ownerReq.message ?? 'Message'}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {r.message || (t.ownerReq.noMessage ?? 'No message provided.')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
