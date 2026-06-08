import { assertCan, type CustomerActor } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { Actor, Paginated } from '@/types';
import { reservationRepository, type BookingResult } from '../repository';
import {
  createBookingSchema,
  listReservationsQuerySchema,
  updateReservationStatusSchema,
  type CreateBookingInput,
  type ListReservationsQuery,
  type UpdateReservationStatusInput,
} from '../validation';
import type { Reservation, ReservationDetail } from '../types';

export const reservationService = {
  async list(actor: Actor, query: ListReservationsQuery): Promise<Paginated<Reservation>> {
    assertCan(actor, 'read', 'reservation');
    const { page, pageSize, status, search, tenantId } = listReservationsQuerySchema.parse(query);
    const scope = actor.role === 'SUPER_ADMIN' ? tenantId : (actor.tenantId ?? undefined);
    if (actor.role !== 'SUPER_ADMIN' && !scope) throw ApiError.forbidden('No tenant scope.');
    const { items, total } = await reservationRepository.findMany({
      tenantId: scope, status, search, skip: (page - 1) * pageSize, take: pageSize,
    });
    return { items, total, page, pageSize };
  },

  async get(actor: Actor, id: string): Promise<ReservationDetail> {
    assertCan(actor, 'read', 'reservation');
    const scope = actor.role === 'SUPER_ADMIN' ? undefined : (actor.tenantId ?? undefined);
    if (actor.role !== 'SUPER_ADMIN' && !scope) throw ApiError.forbidden('No tenant scope.');
    const detail = await reservationRepository.findById(scope, id);
    if (!detail) throw ApiError.notFound('Booking not found.');
    return detail;
  },

  async updateStatus(
    actor: Actor,
    id: string,
    input: UpdateReservationStatusInput,
  ): Promise<ReservationDetail> {
    assertCan(actor, 'update', 'reservation');
    const { status } = updateReservationStatusSchema.parse(input);
    const scope = actor.role === 'SUPER_ADMIN' ? undefined : (actor.tenantId ?? undefined);
    if (actor.role !== 'SUPER_ADMIN' && !scope) throw ApiError.forbidden('No tenant scope.');
    const detail = await reservationRepository.updateStatus(scope, id, status);
    if (!detail) throw ApiError.notFound('Booking not found.');
    return detail;
  },
};

/**
 * Public booking (no admin auth). Submitted by the client website. The customer
 * is the authenticated session customer (if any) or the guest contact in the
 * payload. Pricing is computed server-side; a PENDING reservation is created.
 */
export const publicBookingService = {
  /**
   * Multi-vendor checkout: items may span several providers. They're grouped by
   * the service's tenant and ONE reservation is created per provider — returned
   * as an array (one booking code per provider).
   */
  async create(
    _tenantSlug: string,
    input: CreateBookingInput,
    sessionCustomer: CustomerActor | null,
  ): Promise<BookingResult[]> {
    const data = createBookingSchema.parse(input);
    if (!data.items.length) throw ApiError.badRequest('Your cart is empty.');

    // Resolve each item's owning tenant, then group items by provider.
    const groups = new Map<string, typeof data.items>();
    for (const it of data.items) {
      const tid = await reservationRepository.tenantIdOfService(it.serviceId);
      if (!tid) throw ApiError.badRequest('A selected service is unavailable.');
      const arr = groups.get(tid) ?? [];
      arr.push(it);
      groups.set(tid, arr);
    }

    const results: BookingResult[] = [];
    for (const [tenantId, groupItems] of groups) {
      // Customers are tenant-scoped: a session customer matches one provider,
      // a guest is found/created per provider from the same contact details.
      let customerId: string;
      if (sessionCustomer && sessionCustomer.tenantId === tenantId) {
        customerId = sessionCustomer.id;
      } else if (data.customer) {
        customerId = await reservationRepository.findOrCreateCustomer(tenantId, data.customer);
      } else {
        throw ApiError.badRequest('Sign in or provide contact details to book.');
      }
      results.push(
        await reservationRepository.createBooking(
          tenantId,
          customerId,
          groupItems,
          data.notes,
          data.locale ?? 'fr',
        ),
      );
    }
    return results;
  },
};
