import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * Flat ESLint config (Next 16 ships native flat configs).
 *
 * Beyond Next's defaults, we add ARCHITECTURE ENFORCEMENT for the
 * DDD / modular-monolith layering:
 *
 *   Page/Route → Module API → Service → Repository → Database
 *
 * Pages/routes may only reach a module via its public boundary
 * ("@/modules/<name>"); they may never touch the DB or internal module layers.
 */
const eslintConfig = [
  ...nextCoreWebVitals,

  // app/ (pages + route handlers): no DB, no module internals.
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/db', '@/lib/db/*', '@prisma/client', '.prisma/*'],
              message:
                'Pages/routes must not access the database directly. Go through a Module API → Service → Repository.',
            },
            {
              group: [
                '@/modules/*/repository',
                '@/modules/*/repository/*',
                '@/modules/*/services',
                '@/modules/*/services/*',
                '@/modules/*/validation',
                '@/modules/*/validation/*',
              ],
              message:
                "Import a module only via its public boundary '@/modules/<name>'. Internal layers are off-limits to app/.",
            },
          ],
        },
      ],
    },
  },

  // Service layers depend on repositories, never on the DB directly.
  {
    files: ['src/modules/*/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/db', '@/lib/db/*', '@prisma/client'],
              message:
                'Services must not access the database directly — depend on the module repository layer instead.',
            },
          ],
        },
      ],
    },
  },

  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
