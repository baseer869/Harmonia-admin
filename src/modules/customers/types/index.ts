export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}
