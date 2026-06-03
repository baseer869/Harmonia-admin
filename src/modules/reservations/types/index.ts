export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

/** A booking row in the admin list (enriched with customer + items summary). */
export interface Reservation {
  id: string;
  tenantId: string;
  code: string;
  status: ReservationStatus;
  totalCents: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  itemsCount: number;
  itemsSummary: string;
  scheduledAt: string | null;
  createdAt: string;
}

export interface ReservationItemDetail {
  title: string;
  quantity: number;
  unitPriceCents: number;
  scheduledAt: string | null;
  extras: { name: string; priceCents: number }[];
}

/** A single booking with everything needed for the detail view. */
export interface ReservationDetail extends Reservation {
  subtotalCents: number;
  discountCents: number;
  notes: string | null;
  customerCity: string | null;
  items: ReservationItemDetail[];
}
