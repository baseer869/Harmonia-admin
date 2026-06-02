import type { Actor, Paginated } from '@/types';
import type { CustomerActor } from '@/lib/auth';
import { publicBookingService, reservationService } from '../services';
import type { CreateBookingInput, ListReservationsQuery } from '../validation';
import type { Reservation } from '../types';
import type { BookingResult } from '../repository';

export const reservationApi = {
  list(actor: Actor, query: ListReservationsQuery): Promise<Paginated<Reservation>> {
    return reservationService.list(actor, query);
  },
};

/** Public booking API (no admin auth) — consumed by the client website. */
export const publicBookingApi = {
  create(
    tenantSlug: string,
    input: CreateBookingInput,
    sessionCustomer: CustomerActor | null,
  ): Promise<BookingResult> {
    return publicBookingService.create(tenantSlug, input, sessionCustomer);
  },
};
