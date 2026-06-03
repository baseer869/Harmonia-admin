'use client';

import { useEffect, useState } from 'react';

import { ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';

import type { ReservationStatus } from '../types';
import { ReservationsTable } from './reservations-table';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

/** Bookings listing with working status filter + debounced search. */
export function BookingsView() {
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <ListingCard
      title="Bookings Listing"
      filters={
        <>
          <SelectFilter
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <SearchInput
            placeholder="Search reference, customer, service…"
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
