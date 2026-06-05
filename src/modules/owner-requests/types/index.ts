export type OwnerRequestStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED';

/** A prospective provider lead captured from the public contact form. */
export interface OwnerRequest {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  role: string | null;
  subject: string | null;
  message: string | null;
  status: OwnerRequestStatus;
  tenantId: string | null;
  locale: string;
  createdAt: string;
}
