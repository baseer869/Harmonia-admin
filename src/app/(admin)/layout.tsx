import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/layouts';
import { getCurrentActor } from '@/lib/auth';

/**
 * Authenticated back-office shell. Verifies the actor server-side (the proxy
 * already gated on the cookie's presence) and renders the role-aware shell.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect('/login');

  return (
    <AdminShell role={actor.role} email={actor.email ?? 'admin'}>
      {children}
    </AdminShell>
  );
}
