/**
 * Database access layer.
 *
 * Re-exports the Prisma singleton. Do not import this from `app/` or from
 * module `services/` — only `repository/` layers may touch the database.
 */
export { prisma } from './prisma';
export type { Prisma } from '@prisma/client';
