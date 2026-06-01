import { z } from 'zod';

/**
 * Validated environment access. Import `env` instead of reading
 * `process.env` directly so misconfiguration fails fast and loudly.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Harmonia Admin'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const isServer = typeof window === 'undefined';

/** Server env is only parsed on the server; client bundles see public vars. */
export const env = {
  ...clientSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }),
  ...(isServer
    ? serverSchema.parse({
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV,
      })
    : ({} as z.infer<typeof serverSchema>)),
};
