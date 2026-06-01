import { PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { CreateServiceForm, ServicesTable } from '@/modules/services';

/**
 * Services route — tenant self-service catalog.
 *
 * A Tenant Admin sees/edits ONLY their own tenant's catalog (scoped server-side
 * by tenantId). A Super Admin manages the catalog of the tenant they are
 * currently acting on.
 */
export default function ServicesPage() {
  return (
    <PageHeader
      title="Services"
      description="The services your business offers. Managed per tenant."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add service</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateServiceForm />
        </CardContent>
      </Card>

      <ServicesTable />
    </PageHeader>
  );
}
