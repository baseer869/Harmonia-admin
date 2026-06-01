# Harmonia Admin

Multi-tenant SaaS **admin CRM** for the Harmonia reservation & concierge
platform. Super Admin (Harmonia) creates and operates tenants; each Tenant Admin
manages only their own data.

> Architecture deep-dive: see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

- **Next.js 16** (App Router) · **TypeScript**
- **Tailwind CSS v4** · **shadcn/ui** (new-york)
- **React Hook Form** · **Zod**
- **TanStack Query** · **TanStack Table**
- **Prisma** · **PostgreSQL**
- DDD · Modular Monolith · multi-tenant (`tenantId` + `slug`)

## Getting started

```bash
# 1. install
npm install

# 2. environment
cp .env.example .env          # set DATABASE_URL to your Postgres instance

# 3. database
npm run db:generate           # prisma client
npm run db:migrate            # create schema (needs a running Postgres)

# 4. run
npm run dev                   # http://localhost:3000  → redirects to /dashboard
```

## Scripts

| Script                | Purpose                                  |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Dev server                               |
| `npm run build`       | Production build                         |
| `npm run start`       | Serve the production build               |
| `npm run lint`        | ESLint (incl. architecture boundaries)   |
| `npm run typecheck`   | `tsc --noEmit`                           |
| `npm run db:generate` | Generate Prisma client                   |
| `npm run db:migrate`  | Run a dev migration                      |
| `npm run db:studio`   | Prisma Studio                            |

## Project structure

```
src/
├── app/            routes / layouts / pages ONLY (+ /api route handlers)
├── modules/        all business logic (DDD modules) — auth, tenants, users,
│                   services, reservations, customers, vendors, properties,
│                   payments, reports, settings, dashboard
├── components/     shared UI: ui · forms · tables · layouts · modals
├── lib/            db · auth · api · storage · utils
├── hooks/  types/  constants/  config/
└── proxy.ts        auth + tenant resolution (Next 16 middleware)
```

Each module: `api · repository · services · validation · hooks · components ·
types · index.ts`. **`tenants/` is the fully-implemented reference module.**

## Architecture rule (enforced by ESLint)

```
Page/Route → Module API → Service → Repository → Database
```

Pages may not touch the database or a module's internals — only the module's
public boundary `@/modules/<name>`. See `ARCHITECTURE.md`.

## Status

Foundational architecture + the example **Tenant** module are complete and the
project builds (`npm run build`). The remaining modules are scaffolded (folders,
barrels, public boundaries) and ready for implementation. Auth is a stub: wire a
real provider behind the `Actor`/header contract in `src/lib/auth` + `src/proxy.ts`.
