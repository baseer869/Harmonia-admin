import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants';

export default function RootPage() {
  redirect(ROUTES.dashboard);
}
