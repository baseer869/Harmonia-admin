# Harmonia Admin — Architecture

A **multi-tenant, white-label SaaS** admin CRM for a reservation & concierge
platform. Built as a **DDD modular monolith** structured so any module can later
be lifted into a standalone backend service without touching its consumers.

---

## 1. Layering — the one rule that matters

```
Page / Route handler
        │  (only ever calls a module's public boundary)
        ▼
   Module API            src/modules/<m>/api        ← public contract, framework-agnostic
        ▼
   Service               src/modules/<m>/services   ← business rules + RBAC + tenant isolation
        ▼
   Repository            src/modules/<m>/repository  ← the ONLY place that imports Prisma
        ▼
   Database (Prisma)     src/lib/db
```

**Pages never access the database directly.** This is enforced mechanically by
ESLint (`eslint.config.mjs`), not just by convention:

- `src/app/**` may not import `@/lib/db`, `@prisma/client`, or any module's
  internal `repository` / `services` / `validation` paths. It may only import a
  module via its public barrel `@/modules/<name>`.
- `src/modules/*/services/**` may not import `@/lib/db` / Prisma — services
  depend on the repository abstraction instead.

Try it: add `import { prisma } from '@/lib/db'` to any page and `npm run lint`
fails.

---

## 2. Module anatomy

Every module under `src/modules/<name>/` has the same shape:

```
<name>/
├── api/          public contract — the seam for backend extraction
├── repository/   data access (Prisma); never imported by app/ or services
├── services/     application/domain logic, RBAC + tenant scoping
├── validation/   Zod schemas + inferred DTO types (single source of truth)
├── hooks/        TanStack Query hooks (client → route handlers over HTTP)
├── components/   module-scoped UI
├── types/        domain entities & value objects
└── index.ts      public boundary (re-exports api/hooks/components/types only)
```

**Fully implemented modules:** `tenants/`, `services/`, and the tenant profile
self-service in `settings/`. The remaining modules are scaffolded with the same
folders + barrels, ready to fill in.

### Server vs. client boundary

Each implemented module exposes **two** public entry points:

- `@/modules/<m>` (`index.ts`) — **client-safe / shared**: types, validation,
  hooks, components. Safe to import from client components.
- `@/modules/<m>/server` (`server.ts`) — **server-only**: the API contract
  (`tenantApi` / `serviceApi`), which reaches into service → repository → db.
  Import only from route handlers / Server Components.

This split prevents server-only code (Prisma, `next/headers`) from leaking into
client bundles via a shared barrel.

### Why this is "backend-extraction ready"

The **Module API** (`api/index.ts`) is framework-agnostic: it takes an explicit
`Actor` and returns plain domain objects. Today it calls the in-process service.
To extract a module into its own service later, you swap that single file's
implementation to call a remote API — **no consumer changes**, because everyone
depends on the contract, not the implementation. Client hooks already speak HTTP
to route handlers via `lib/api/http`, so they only need a base-URL change.

---

## 3. Multi-tenancy

**Strategy:** shared database + shared schema + a `tenantId` discriminator
column on every business entity (row-level isolation). See `prisma/schema.prisma`.

- `Tenant` is the platform root aggregate (owned by Harmonia, not by a tenant).
- `slug` is the human-readable, brandable identifier used for routing,
  subdomains and future custom domains. `id` (`tenantId`) is the internal
  isolation key.
- Every tenant-owned row carries `tenantId`; the **service layer** is the single
  chokepoint that injects/enforces the active tenant scope before any repository
  call.

### The isolation chokepoint

`src/lib/auth/tenant-context.ts → resolveTenantContext(actor, requestedTenantId)`:

- `SUPER_ADMIN` (Harmonia) has no home tenant and **must** name the tenant they
  act on — this is how Harmonia manages a tenant's catalog/data on their behalf
  in the early operating model. Such actions are flagged `impersonated` for
  auditing.
- `TENANT_ADMIN` / `TENANT_STAFF` are pinned to their own `tenantId`; any attempt
  to target another tenant throws `ForbiddenError`.

---

## 4. Roles & RBAC

Defined in `src/constants/roles.ts`, enforced in `src/lib/auth/rbac.ts`.

| Role           | Scope            | Highlights                                            |
| -------------- | ---------------- | ----------------------------------------------------- |
| `SUPER_ADMIN`  | All tenants      | Creates/manages tenants **and** their data (catalog…) |
| `TENANT_ADMIN` | Own tenant only  | Manages own Services catalog + tenant Profile         |
| `TENANT_STAFF` | Own tenant only  | Scoped operational access (e.g. read catalog)         |

Only the platform (`SUPER_ADMIN`) can **create** tenants; tenant admins can read
and update their own tenant record. Every service method opens with
`assertCan(actor, action, resource)`.

### Tenant self-service (current scope)

There is **no separate tenant app, subdomain, or per-tenant dashboard**.
Everyone logs into this one admin. Navigation is **role-gated**
(`constants/routes.ts` → `NAV_ITEMS[].roles`, filtered in the sidebar), so a
Tenant Admin sees only their minimal surface:

- **Services** — their own catalog (`modules/services`, scoped by `tenantId`).
- **Settings** — their tenant **Profile** (`modules/settings`, which composes
  `modules/tenants` via `/api/profile`).

A Super Admin sees everything and can manage any tenant's catalog/profile on
their behalf. (Nav gating is UX only — pages enforce access server-side.)

---

## 5. Request identity (auth)

`src/proxy.ts` (Next 16's renamed `middleware`) authenticates the request and
forwards the principal as request headers (`x-actor-id`, `x-actor-role`,
`x-tenant-id`). `src/lib/auth/getCurrentActor()` reads them back into an `Actor`.

> Both are **stubs**: the proxy parses a placeholder cookie and `getCurrentActor`
> falls back to a dev `SUPER_ADMIN`. Swap in a real provider (JWT/NextAuth/Clerk)
> behind the same header contract and nothing downstream changes.

The customer-facing **client app** will resolve the tenant from the
host/subdomain instead of the session — same `Actor`/`TenantContext` contract.

---

## 6. Path aliases

`@/*` → `src/*` (see `tsconfig.json`). Modules are always imported via their
public boundary: `@/modules/tenants`, never `@/modules/tenants/repository`.

---

## 7. Data flow example (Tenants)

```
src/app/tenants/page.tsx
  → <TenantsTable/>            (@/modules/tenants, client component)
    → useTenants()             TanStack Query hook
      → GET /api/tenants       lib/api/http
        → app/api/tenants/route.ts   resolves Actor, calls module API
          → tenantApi.list(actor, q) (@/modules/tenants public contract)
            → tenantService.list      RBAC + (super-admin-only) listing
              → tenantRepository.findMany   Prisma
                → PostgreSQL
```
