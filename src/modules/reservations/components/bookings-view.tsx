'use client';

import { useEffect, useState } from 'react';

import { ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';
import { useAdminI18n } from '@/lib/i18n/provider';

import type { ReservationStatus } from '../types';
import { ReservationsTable } from './reservations-table';

/** Bookings listing with working status filter + debounced search. */
export function BookingsView() {
  const { t } = useAdminI18n();
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'PENDING', label: t.status.PENDING },
    { value: 'CONFIRMED', label: t.status.CONFIRMED },
    { value: 'CANCELLED', label: t.status.CANCELLED },
    { value: 'COMPLETED', label: t.status.COMPLETED },
  ];

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <ListingCard
      title={t.bookings.listing}
      filters={
        <>
          <SelectFilter
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <SearchInput
            placeholder={t.bookings.searchPlaceholder}
            className="sm:w-[320px]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </>
      }
    >
      <ReservationsTable
        status={(status || undefined) as ReservationStatus | undefined}
        search={search || undefined}
      />
    </ListingCard>
  );
}
