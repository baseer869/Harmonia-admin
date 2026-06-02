import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { LoginForm } from '@/modules/auth';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="text-primary mb-1 text-lg font-semibold tracking-[0.2em]">
          HARMONIA
        </div>
        <CardTitle>Admin sign in</CardTitle>
        <CardDescription>
          Multi-tenant control panel · authorized staff only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
