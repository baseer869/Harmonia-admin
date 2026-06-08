import type { Actor, Paginated } from '@/types';
import type { CustomerActor } from '@/lib/auth';
import { publicBookingService, reservationService } from '../services';
import type {
  CreateBookingInput,
  ListReservationsQuery,
  UpdateReservationStatusInput,
} from '../validation';
import type { Reservation, ReservationDetail } from '../types';
import type { BookingResult } from '../repository';

export const reservationApi = {
  list(actor: Actor, query: ListReservationsQuery): Promise<Paginated<Reservation>> {
    return reservationService.list(actor, query);
  },
  get(actor: Actor, id: string): Promise<ReservationDetail> {
    return reservationService.get(actor, id);
  },
  updateStatus(
    actor: Actor,
    id: string,
    input: UpdateReservationStatusInput,
  ): Promise<ReservationDetail> {
    return reservationService.updateStatus(actor, id, input);
  },
};

/** Public booking API (no admin auth) — consumed by the client website. */
export const publicBookingApi = {
  create(
    tenantSlug: string,
    input: CreateBookingInput,
    sessionCustomer: CustomerActor | null,
  ): Promise<BookingResult[]> {
    return publicBookingService.create(tenantSlug, input, sessionCustomer);
  },
};
