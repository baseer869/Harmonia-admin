'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/** Admin navigation rail. Items are filtered by the current actor's role. */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center px-5 text-base font-semibold tracking-tight">
        Harmonia
        <span className="text-muted-foreground ml-1.5 text-xs font-normal">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => {
          const href = ROUTES[item.key];
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex h-9 items-center rounded-md px-3 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
