export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export interface Reservation {
  id: string;
  tenantId: string;
  code: string;
  status: ReservationStatus;
  totalCents: number;
  currency: string;
  customerEmail: string | null;
  scheduledAt: string | null;
  createdAt: string;
}
