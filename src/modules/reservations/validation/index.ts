import { z } from 'zod';

export const reservationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

export const listReservationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: reservationStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
  tenantId: z.string().optional(),
});
export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;

export const updateReservationStatusSchema = z.object({
  status: reservationStatusSchema,
});
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;

/** A line in a booking request (one chosen service). */
export const bookingItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  people: z.coerce.number().int().min(1).optional(),
  optionName: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  extras: z
    .array(z.object({ name: z.string(), priceCents: z.coerce.number().int().min(0) }))
    .default([]),
});

/** Booking request from the client website. Customer is the session customer
 *  or, for a guest, the inline contact. */
export const createBookingSchema = z.object({
  items: z.array(bookingItemSchema).min(1, 'At least one item.'),
  notes: z.string().max(2000).optional(),
  locale: z.string().max(5).optional(), // language the booking was made in

  customer: z
    .object({
      name: z.string().min(1).optional(),
      email: z.string().email(),
      phone: z.string().optional(),
    })
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
