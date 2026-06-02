'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { useLogout } from '@/modules/auth';

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Tenant Admin',
  TENANT_STAFF: 'Staff',
};

/** Slim fixed header: global search + notifications + user menu. */
export function Topbar({ role, email }: { role: Role; email: string }) {
  const router = useRouter();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = email.slice(0, 2).toUpperCase();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const signOut = async () => {
    await logout.mutateAsync();
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="bg-card sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b px-6 lg:px-8">
      <div className="relative hidden w-full max-w-md sm:block">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Search…"
          className="focus:border-primary h-10 w-full rounded-lg border-2 border-[#C2C2C2] bg-transparent pr-3 pl-10 text-[14px] outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-muted-foreground hover:bg-accent hover:text-foreground relative grid size-9 place-items-center rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="bg-primary absolute top-2 right-2 size-2 rounded-full" />
        </button>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="hover:bg-accent flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors"
          >
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-full text-sm font-semibold">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[180px] truncate text-sm font-medium">
                {email}
              </span>
              <span className="text-muted-foreground block text-xs">
                {ROLE_LABEL[role]}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'text-muted-foreground size-4 transition-transform',
                open && 'rotate-180',
              )}
            />
          </button>

          {open && (
            <div className="bg-popover absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border shadow-lg">
              <div className="border-b px-4 py-3">
                <div className="truncate text-sm font-medium">{email}</div>
                <div className="text-muted-foreground text-xs">
                  {ROLE_LABEL[role]}
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                disabled={logout.isPending}
                className="hover:bg-accent text-destructive flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              >
                <LogOut className="size-4" />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
