'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';
import { useLogout } from '@/modules/auth';

export function LogoutButton() {
  const router = useRouter();
  const logout = useLogout();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={logout.isPending}
      onClick={async () => {
        await logout.mutateAsync();
        router.replace('/login');
        router.refresh();
      }}
    >
      {logout.isPending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
