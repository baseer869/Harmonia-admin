'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Reservation, ReservationDetail, ReservationStatus } from '../types';
import type { ListReservationsQuery } from '../validation';

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (q: Partial<ListReservationsQuery>) => [...reservationKeys.all, 'list', q] as const,
  detail: (id: string) => [...reservationKeys.all, 'detail', id] as const,
};

function qs(q?: Partial<ListReservationsQuery>) {
  if (!q) return '';
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.status) p.set('status', q.status);
  if (q.search) p.set('search', q.search);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useReservations(query?: Partial<ListReservationsQuery>) {
  return useQuery({
    queryKey: reservationKeys.list(query ?? {}),
    queryFn: () => http.get<Paginated<Reservation>>(`/api/reservations${qs(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useReservation(id?: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ''),
    queryFn: () => http.get<ReservationDetail>(`/api/reservations/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateReservationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ReservationStatus) =>
      http.patch<ReservationDetail>(`/api/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}
