import { PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { CreateTenantForm, TenantsTable } from '@/modules/tenants';

/**
 * Tenants route (Super Admin).
 *
 * The page only touches the module's PUBLIC components — it never imports the
 * service, repository or Prisma. Data flows:
 *   page → TenantsTable (useTenants hook) → /api/tenants → tenantApi → service
 *        → repository → database.
 */
export default function TenantsPage() {
  return (
    <PageHeader
      title="Tenants"
      description="Create and manage tenant organizations (Super Admin)."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>

      <TenantsTable />
    </PageHeader>
  );
}
