import { PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { TenantProfileForm } from '@/modules/settings';

/**
 * Settings route — tenant Profile self-service.
 *
 * A Tenant Admin manages their own tenant's profile here. A Super Admin manages
 * the profile of the tenant they are currently acting on.
 */
export default function SettingsPage() {
  return (
    <PageHeader
      tkey="settings"
      title="Settings"
      description="Manage your tenant profile."
    >
      <Card>
        <CardHeader>
          <CardTitle>Tenant profile</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantProfileForm />
        </CardContent>
      </Card>
    </PageHeader>
  );
}
