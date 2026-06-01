import * as React from 'react';

import type { Role } from '@/types';
import { Sidebar } from './sidebar';

/** App chrome: role-aware sidebar + scrollable content region. */
export function AdminShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-muted-foreground text-sm">
            Multi-tenant control panel
          </span>
          <span className="text-muted-foreground text-xs">{role}</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
