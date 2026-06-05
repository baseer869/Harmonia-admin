'use client';

import { useEffect, useState } from 'react';

import { ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';
import { useAdminI18n } from '@/lib/i18n/provider';

import type { OwnerRequestStatus } from '../types';
import { OwnerRequestsTable } from './owner-requests-table';

/** Owner-requests listing with status filter + debounced search. */
export function OwnerRequestsView() {
  const { t } = useAdminI18n();
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'NEW', label: t.ownerReq.statusNEW ?? 'New' },
    { value: 'REVIEWING', label: t.ownerReq.statusREVIEWING ?? 'Reviewing' },
    { value: 'APPROVED', label: t.ownerReq.statusAPPROVED ?? 'Approved' },
    { value: 'REJECTED', label: t.ownerReq.statusREJECTED ?? 'Rejected' },
    { value: 'CONVERTED', label: t.ownerReq.statusCONVERTED ?? 'Converted' },
  ];

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <ListingCard
      title={t.ownerReq.listing ?? 'Provider requests'}
      filters={
        <>
          <SelectFilter
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <SearchInput
            placeholder={t.ownerReq.searchPlaceholder}
            className="sm:w-[320px]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </>
      }
    >
      <OwnerRequestsTable
        status={(status || undefined) as OwnerRequestStatus | undefined}
        search={search || undefined}
      />
    </ListingCard>
  );
}
