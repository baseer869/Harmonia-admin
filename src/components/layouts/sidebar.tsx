'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Building2, ChevronDown, ChevronsUpDown } from 'lucide-react';

import { NAV_ITEMS, ROUTES, type NavItem } from '@/constants';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const isActive = (key: keyof typeof ROUTES) => {
    const href = ROUTES[key];
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Accordion: only one group open at a time. The group containing the active
  // route opens automatically; navigating to another section collapses it.
  const activeGroupId = items.find(
    (item) => item.children?.some((c) => isActive(c.key)),
  )?.id;
  const [openId, setOpenId] = useState<string | undefined>(activeGroupId);
  useEffect(() => {
    if (activeGroupId) setOpenId(activeGroupId);
  }, [activeGroupId]);

  return (
    <aside className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 hidden w-[404px] flex-col md:flex">
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 px-6">
        <span className="text-sidebar grid size-10 place-items-center rounded-lg bg-white text-base font-bold">
          H
        </span>
        <div className="leading-tight">
          <div className="text-lg font-semibold tracking-[0.18em] text-white">
            HARMONIA
          </div>
          <div className="text-xs tracking-[0.16em] text-white/65 uppercase">
            Admin
          </div>
        </div>
      </div>

      {/* Tenant switcher */}
      <div className="px-5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/15"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white/15 text-white">
            <Building2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1 text-white">
            <span className="block truncate text-[15px] font-medium">
              {role === 'SUPER_ADMIN' ? 'All Tenants' : 'My Workspace'}
            </span>
            <span className="block text-xs text-white/65">Harmonia SaaS</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-white/70" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {items.map((item) =>
          item.children ? (
            <NavGroup
              key={item.id}
              item={item}
              role={role}
              isActive={isActive}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((cur) => (cur === item.id ? undefined : item.id))
              }
            />
          ) : (
            <NavLeaf
              key={item.id}
              href={ROUTES[item.href!]}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href!)}
            />
          ),
        )}
      </nav>
    </aside>
  );
}

function NavLeaf({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: NavItem['icon'];
  active: boolean;
}) {
  return (
    <Link
      href={href as Route}
      className={cn(
        'group relative flex h-14 items-center gap-4 px-4 text-[22px] font-medium leading-none transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground -mr-5 rounded-l-full rounded-r-none pr-5 shadow-sm'
          : 'text-sidebar-foreground rounded-xl hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon
        className={cn(
          'size-6 shrink-0',
          active ? 'text-sidebar-accent-foreground' : 'text-white/80 group-hover:text-white',
        )}
      />
      {label}
    </Link>
  );
}

function NavGroup({
  item,
  role,
  isActive,
  open,
  onToggle,
}: {
  item: NavItem;
  role: Role;
  isActive: (key: keyof typeof ROUTES) => boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const children = item.children!.filter((c) => c.roles.includes(role));
  const anyActive = children.some((c) => isActive(c.key));
  const Icon = item.icon;

  // Most-important sub-tab: the first role-permitted child. Clicking the group
  // jumps straight here and auto-activates it (no extra "open then pick" step).
  const defaultChild = children[0];

  if (!defaultChild) return null;

  return (
    <div>
      <div
        className={cn(
          'group flex h-14 items-center gap-4 px-4 text-[22px] font-medium transition-colors',
          anyActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground -mr-5 rounded-l-full rounded-r-none pr-2 shadow-sm'
            : 'text-sidebar-foreground rounded-xl hover:bg-white/10 hover:text-white',
        )}
      >
        <Link
          href={ROUTES[defaultChild.key] as Route}
          className="flex flex-1 items-center gap-4 outline-none"
        >
          <Icon
            className={cn(
              'size-6 shrink-0',
              anyActive ? 'text-sidebar-accent-foreground' : 'text-white/80 group-hover:text-white',
            )}
          />
          <span className="text-left">{item.label}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? 'Collapse' : 'Expand'}
          onClick={onToggle}
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full transition-colors',
            anyActive ? 'hover:bg-black/5' : 'hover:bg-white/10',
          )}
        >
          <ChevronDown
            className={cn('size-5 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      {open && (
        <div className="-mr-5 mt-3 space-y-2.5 pr-0 pl-6">
          {children.map((c) => {
            const active = isActive(c.key);
            return (
              <Link
                key={c.key}
                href={ROUTES[c.key] as Route}
                className={cn(
                  'flex h-12 items-center px-4 text-[18px] font-medium transition-colors',
                  active
                    ? 'rounded-l-full rounded-r-none bg-black/25 font-semibold text-white shadow-sm'
                    : 'text-sidebar-foreground rounded-l-full hover:bg-white/10 hover:text-white',
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
