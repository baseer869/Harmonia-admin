'use client';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Reservation } from '../types';
import type { ListReservationsQuery } from '../validation';
export const reservationKeys = { all: ['reservations'] as const, list: (q: Partial<ListReservationsQuery>) => [...reservationKeys.all, 'list', q] as const };
function qs(q?: Partial<ListReservationsQuery>) { if (!q) return ''; const p = new URLSearchParams(); if (q.page) p.set('page', String(q.page)); if (q.status) p.set('status', q.status); const s = p.toString(); return s ? `?${s}` : ''; }
export function useReservations(query?: Partial<ListReservationsQuery>) {
  return useQuery({ queryKey: reservationKeys.list(query ?? {}), queryFn: () => http.get<Paginated<Reservation>>(`/api/reservations${qs(query)}`) });
}
