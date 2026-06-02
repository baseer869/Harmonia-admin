/** Dashboard · domain types. */
export interface ChartPoint {
  label: string;
  value: number;
}
export interface DashboardStats {
  tenants?: number; // platform-only (Super Admin)
  services: number;
  customers: number;
  reservations: number;
  pendingReservations: number;
  revenueCents: number;
  currency: string;
  /** Reservations per month, last 6 months. */
  series: ChartPoint[];
}
