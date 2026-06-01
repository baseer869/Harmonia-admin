import type { Metadata } from 'next';
import './globals.css';

import { AdminShell } from '@/components/layouts';
import { siteConfig } from '@/config';
import { getCurrentActor } from '@/lib/auth';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AdminShell role={actor?.role ?? 'TENANT_STAFF'}>
            {children}
          </AdminShell>
        </Providers>
      </body>
    </html>
  );
}
