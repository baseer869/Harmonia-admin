import * as React from 'react';

import type { Role } from '@/types';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/** Enterprise shell: fixed sidebar + fixed header + scrollable content. */
export function AdminShell({
  role,
  email,
  children,
}: {
  role: Role;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <Sidebar role={role} />
      <div className="flex min-h-screen flex-col md:pl-[404px]">
        <Topbar role={role} email={email} />
        <main className="w-full flex-1 p-6 lg:px-10 lg:py-8 2xl:max-w-450">
          {children}
        </main>
      </div>
    </div>
  );
}
