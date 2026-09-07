# Aviation Maintenance Dashboard

Vite + React 19 + TypeScript + Tailwind 4 SPA with a Convex backend.
Bilingual (EN/AR) maintenance dashboard: regions, sites, engineers,
equipment, inventory, licensing and access.

## What changed in this version

The original export from Hercules used **Hercules' own hosted OIDC login**
and pointed at a **Hercules-managed, shared Convex deployment**. That's
almost certainly why login broke after deploying independently to Vercel —
Hercules' identity provider only allows redirects back to domains it
knows about, and a new Vercel URL isn't on that list, with no self-service
way to add it.

This version replaces that entirely with **Convex Auth's email/password
provider** (`@convex-dev/auth`), which is self-hosted inside your own
Convex deployment — no external identity provider, no allow-list to
manage, and no dependency on Hercules at all. You now own the full stack.

What this means practically: **you need your own Convex deployment**, not
the old Hercules-managed URL. The steps below cover that.

## First-time setup

```bash
npm install
npx convex dev
```

`npx convex dev` will prompt you to log in to Convex and create a new
project (free tier is fine). Leave it running — it deploys your functions
and schema, and prints your deployment's `VITE_CONVEX_URL`.

It also needs two more environment variables that Convex Auth uses to
sign its own login tokens. Generate and set them once with:

```bash
npx @convex-dev/auth
```

This walks you through it and runs `npx convex env set` for you — you
don't need to generate any keys by hand.

### Create the admin account

Once `npx convex dev` is running, seed a super-admin account you can log
in with immediately:

```bash
npx convex run adminSeed:seedAdmin
```

This creates (or repairs) an account:

- **email:** `admin@admin.local`
- **password:** `admin`

**Change this password immediately after your first login** (or delete
the account and create your own super-admin by signing up normally — the
very first person to ever sign in is automatically made super_admin, so
if you seed and then delete the seeded admin, whoever signs up next
becomes super_admin instead).

In a separate terminal, run the frontend:

```bash
npm run dev            # http://localhost:5173
```

## Build

```bash
npm run build           # tsc -b && vite build
npm run preview
```

## Environment variables

| Variable | Where it's set | Meaning |
| --- | --- | --- |
| `VITE_CONVEX_URL` | Vercel / `.env.local` | Your Convex deployment URL. Get it from `npx convex dev` output or the Convex dashboard. |
| `JWT_PRIVATE_KEY` | Convex (via `npx @convex-dev/auth`) | Signs Convex Auth's session tokens. |
| `JWKS` | Convex (via `npx @convex-dev/auth`) | Public key set used to verify those tokens. |

Note `JWT_PRIVATE_KEY`/`JWKS` live in **Convex's** environment (set via the
Convex CLI/dashboard), not Vercel's — Vercel only needs `VITE_CONVEX_URL`.

## Deploy to Vercel

1. `npx convex deploy` to push your functions/schema to a production Convex
   deployment (separate from your `dev` one).
2. In Vercel's project settings, set `VITE_CONVEX_URL` to that production
   deployment's URL.
3. Framework preset: **Vite**. Deploy.
4. Run `npx convex run adminSeed:seedAdmin --prod` once against the
   production deployment to create your admin login.

No redirect-URI allow-list, no third-party identity provider config —
whatever domain Vercel gives you will work immediately, since auth is
served entirely by your own Convex deployment.

## Inviting other engineers

The **Access** page (super_admin only) still works exactly as before:
invite someone by email, assign a role/site, and they'll be granted that
role automatically the first time they sign up with a matching email.
Anyone who signs up *without* a matching invite lands in a "pending"
screen until a super_admin invites them.
