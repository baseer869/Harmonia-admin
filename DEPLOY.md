# Deploy — Harmonia Admin (Railway)

The admin owns Postgres + Prisma and exposes the public API the client consumes.
Deploy this **first** (the client needs its URL).

## 1. Push this folder to its own GitHub repo
```bash
cd harmonia-admin
git init
git add -A
git commit -m "Harmonia admin"
git branch -M main
git remote add origin git@github.com:<you>/harmonia-admin.git
git push -u origin main
```
`.env` is gitignored — only `.env.example` is committed.

## 2. Railway project + Postgres
1. Railway → **New Project → Deploy from GitHub repo** → pick `harmonia-admin`.
2. In the project, **New → Database → Add PostgreSQL**.
3. Open the admin service → **Settings → Networking → Generate Domain**
   (note the URL, e.g. `https://harmonia-admin.up.railway.app`).

## 3. Environment variables (admin service → Variables)
| Key | Value |
|-----|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the plugin) |
| `AUTH_SECRET` | output of `openssl rand -base64 48` |
| `CLIENT_ORIGIN` | the deployed **client** URL (set after step in client repo) |
| `NEXT_PUBLIC_APP_URL` | this admin's URL |

Build/start are auto-detected (`npm run build` / `npm start`). `postinstall`
runs `prisma generate`.

## 4. Run migrations + seed (one time)
From the service's **Deployments → ⋯ → Run command**, or locally with the
public `DATABASE_URL`:
```bash
npm run db:deploy        # prisma migrate deploy
npm run db:seed          # creates the demo tenant + super admin + services
```
Seed login: `super@harmonia.test` / `Passw0rd!`. Seed tenant slug:
`marrakech-luxury` (this is what the client's `NEXT_PUBLIC_TENANT_SLUG` must match).

## 5. After the client is deployed
Set `CLIENT_ORIGIN` to the client's URL and redeploy, so CORS on
`/api/public/*` accepts it.

---

## Demo caveats
- **Image uploads** (`public/uploads/…`) are written to the container disk and
  are wiped on redeploy. Seed services use external image URLs, so the catalog
  shows fine; admin-uploaded logos/covers won't persist across deploys. For a
  permanent fix, move `src/lib/storage` to a blob store (S3 / Cloudinary).
- **Guest bookings need no cookies** and work cross-origin out of the box.
  Logged-in customer sessions use a `SameSite=None; Secure` cookie (already
  configured) — fine over HTTPS, which Railway provides.
