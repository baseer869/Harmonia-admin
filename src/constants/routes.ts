import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarCheck2,
  ConciergeBell,
  Home,
  Inbox,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
  Wallet,
  Handshake,
} from 'lucide-react';

import type { Role } from '@/types';

/** Centralised admin route map — avoids stringly-typed links across the app. */
export const ROUTES = {
  dashboard: '/dashboard',
  tenants: '/tenants',
  users: '/users',
  services: '/services',
  categories: '/categories',
  reservations: '/reservations',
  customers: '/customers',
  ownerRequests: '/owner-requests',
  vendors: '/vendors',
  properties: '/properties',
  payments: '/payments',
  reports: '/reports',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;

export interface NavChild {
  key: RouteKey;
  label: string;
  roles: ReadonlyArray<Role>;
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: ReadonlyArray<Role>;
  /** Leaf route (when there are no children). */
  href?: RouteKey;
  /** Nested submenu (e.g. Users Management → Admins, App Users). */
  children?: NavChild[];
  /** Expand the submenu by default. */
  defaultOpen?: boolean;
  /** Hide from the sidebar without removing the route/page (unused for now). */
  hidden?: boolean;
}

const ALL: ReadonlyArray<Role> = ['SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_STAFF'];
const SUPER: ReadonlyArray<Role> = ['SUPER_ADMIN'];
const ADMINS: ReadonlyArray<Role> = ['SUPER_ADMIN', 'TENANT_ADMIN'];

/**
 * Sidebar navigation (leaf items + nested groups). Role-gated for UX; pages
 * still enforce access server-side.
 */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL, href: 'dashboard' },
  {
    id: 'users-mgmt',
    label: 'Users Management',
    icon: Users,
    roles: ADMINS,
    children: [
      { key: 'users', label: 'Admins', roles: SUPER },
      { key: 'customers', label: 'App Users', roles: ALL },
      { key: 'tenants', label: 'Tenants', roles: SUPER },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: ConciergeBell,
    roles: ALL,
    defaultOpen: true,
    children: [
      { key: 'services', label: 'Catalog', roles: ALL },
      { key: 'categories', label: 'Categories', roles: ALL },
    ],
  },
  { id: 'reservations', label: 'Bookings', icon: CalendarCheck2, roles: ALL, href: 'reservations' },
  { id: 'ownerRequests', label: 'Owner Requests', icon: Inbox, roles: ADMINS, href: 'ownerRequests' },
  // Hidden for now (pages kept, just not shown in the sidebar).
  { id: 'vendors', label: 'Vendors', icon: Handshake, roles: SUPER, href: 'vendors', hidden: true },
  { id: 'properties', label: 'Properties', icon: Home, roles: SUPER, href: 'properties', hidden: true },
  { id: 'payments', label: 'Payments', icon: Wallet, roles: SUPER, href: 'payments', hidden: true },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: SUPER, href: 'reports', hidden: true },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ADMINS, href: 'settings' },
];
