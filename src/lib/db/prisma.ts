import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client.
 *
 * IMPORTANT: this is the *only* gateway to the database. It must be imported
 * exclusively from module `repository/` layers — never from `app/`, pages,
 * route handlers, or service layers (enforced by eslint).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
