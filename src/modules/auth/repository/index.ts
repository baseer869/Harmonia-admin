import { prisma } from '@/lib/db';

/** Auth · repository (data access for users, customers, tenant lookup). */
export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  touchUserLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  findTenantBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  findCustomer(tenantId: string, email: string) {
    return prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  },
  createCustomer(data: {
    tenantId: string;
    email: string;
    name?: string | null;
    passwordHash: string;
  }) {
    return prisma.customer.create({ data });
  },
};
