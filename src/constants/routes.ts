import type { Role } from '@/types';

/** Centralised admin route map — avoids stringly-typed links across the app. */
export const ROUTES = {
  dashboard: '/dashboard',
  tenants: '/tenants',
  users: '/users',
  services: '/services',
  reservations: '/reservations',
  customers: '/customers',
  vendors: '/vendors',
  properties: '/properties',
  payments: '/payments',
  reports: '/reports',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;

export interface NavItem {
  key: RouteKey;
  label: string;
  /** Roles allowed to see this nav entry. */
  roles: ReadonlyArray<Role>;
}

const ALL: ReadonlyArray<Role> = ['SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_STAFF'];
const SUPER: ReadonlyArray<Role> = ['SUPER_ADMIN'];

/**
 * Sidebar navigation. Visibility is role-gated so a Tenant Admin sees only
 * their minimal self-service surface (Services + Settings/profile), while the
 * platform Super Admin sees everything. Pages still enforce access server-side;
 * this is UX, not the security boundary.
 */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: 'dashboard', label: 'Dashboard', roles: ALL },
  { key: 'tenants', label: 'Tenants', roles: SUPER },
  { key: 'users', label: 'Users', roles: SUPER },
  { key: 'services', label: 'Services', roles: ALL },
  { key: 'reservations', label: 'Reservations', roles: SUPER },
  { key: 'customers', label: 'Customers', roles: SUPER },
  { key: 'vendors', label: 'Vendors', roles: SUPER },
  { key: 'properties', label: 'Properties', roles: SUPER },
  { key: 'payments', label: 'Payments', roles: SUPER },
  { key: 'reports', label: 'Reports', roles: SUPER },
  { key: 'settings', label: 'Settings', roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
];
