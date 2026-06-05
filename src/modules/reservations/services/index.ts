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
  async create(
    _tenantSlug: string,
    input: CreateBookingInput,
    sessionCustomer: CustomerActor | null,
  ): Promise<BookingResult> {
    const data = createBookingSchema.parse(input);

    // Marketplace: the booking belongs to the tenant that owns the service.
    const firstServiceId = data.items[0]?.serviceId;
    const tenantId = firstServiceId
      ? await reservationRepository.tenantIdOfService(firstServiceId)
      : null;
    if (!tenantId) throw ApiError.badRequest('A selected service is unavailable.');

    // Resolve the customer: session (must match tenant) or guest contact.
    let customerId: string;
    if (sessionCustomer && sessionCustomer.tenantId === tenantId) {
      customerId = sessionCustomer.id;
    } else if (data.customer) {
      customerId = await reservationRepository.findOrCreateCustomer(tenantId, data.customer);
    } else {
      throw ApiError.badRequest('Sign in or provide contact details to book.');
    }

    return reservationRepository.createBooking(tenantId, customerId, data.items, data.notes, data.locale ?? 'fr');
  },
};
