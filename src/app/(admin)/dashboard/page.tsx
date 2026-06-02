import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  Clock,
  ConciergeBell,
  UserRound,
  Wallet,
} from 'lucide-react';

import { PageHeader, ListingCard } from '@/components/layouts';
import {
  AreaChart,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { getCurrentActor } from '@/lib/auth';
import { dashboardApi, type DashboardStats } from '@/modules/dashboard/server';
import { reservationApi, type Reservation } from '@/modules/reservations/server';

const EMPTY: DashboardStats = {
  tenants: 0,
  services: 0,
  customers: 0,
  reservations: 0,
  pendingReservations: 0,
  revenueCents: 0,
  currency: 'MAD',
  series: [],
};

const money = (cents: number, cur: string) =>
  `${(cents / 100).toLocaleString()} ${cur}`;

const QUICK_LINKS = [
  { href: '/tenants', label: 'Add a tenant', icon: Building2, super: true },
  { href: '/users', label: 'Invite a user', icon: UserRound, super: true },
  { href: '/services', label: 'Manage services', icon: ConciergeBell, super: false },
  { href: '/reservations', label: 'View bookings', icon: CalendarCheck2, super: false },
];

export default async function DashboardPage() {
  const actor = await getCurrentActor();
  const isSuper = actor?.role === 'SUPER_ADMIN';

  let stats = EMPTY;
  let recent: Reservation[] = [];
  let dbReady = true;
  try {
    if (actor) {
      stats = await dashboardApi.getStats(actor);
      recent = (await reservationApi.list(actor, { page: 1, pageSize: 6 })).items;
    }
  } catch {
    dbReady = false;
  }

  const chart = stats.series.length
    ? stats.series
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label) => ({ label, value: 0 }));

  const kpis = [
    ...(stats.tenants !== undefined
      ? [{ label: 'Tenants', value: String(stats.tenants), icon: Building2 }]
      : []),
    { label: 'Services', value: String(stats.services), icon: ConciergeBell },
    { label: 'Customers', value: String(stats.customers), icon: UserRound },
    { label: 'Bookings', value: String(stats.reservations), icon: CalendarCheck2 },
    { label: 'Pending', value: String(stats.pendingReservations), icon: Clock },
    { label: 'Revenue', value: money(stats.revenueCents, stats.currency), icon: Wallet },
  ];

  return (
    <PageHeader
      title="Dashboard"
      showBack={false}
      description={
        isSuper
          ? 'Platform-wide overview across all tenants.'
          : 'Overview of your tenant activity.'
      }
      actions={
        <Badge variant="outline" className="rounded-full px-3 py-1 font-normal">
          Current month
        </Badge>
      }
    >
      {!dbReady && (
        <div className="border-primary/30 bg-accent text-accent-foreground rounded-lg border px-4 py-3 text-sm">
          Database not connected — showing zeros. Run{' '}
          <code className="font-mono">npm run db:migrate</code> &amp;{' '}
          <code className="font-mono">npm run db:seed</code>.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            trend={{ value: '+0.0%', positive: true }}
            hint="vs last month"
          />
        ))}
      </div>

      {/* Chart + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Bookings</CardTitle>
              <p className="text-muted-foreground text-sm">Last 6 months</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">
                {stats.reservations}
              </div>
              <div className="text-muted-foreground text-xs">total</div>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart data={chart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_LINKS.filter((l) => !l.super || isSuper).map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href as Route}
                  className="hover:bg-accent group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
                >
                  <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 font-medium">{l.label}</span>
                  <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <ListingCard title="Recent bookings">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No reservations yet.
                </TableCell>
              </TableRow>
            ) : (
              recent.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>{r.customerEmail ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>{money(r.totalCents, r.currency)}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ListingCard>
    </PageHeader>
  );
}
