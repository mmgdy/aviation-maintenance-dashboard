# Aviation Maintenance Dashboard

Vite + React 19 + TypeScript + Tailwind 4 SPA with a Convex backend, exported from
Hercules (original: https://azka.onhercules.app). Bilingual (EN/AR) maintenance
dashboard: regions, sites, engineers, equipment, inventory, licensing and access.

## Quick start

```bash
pnpm install
cp .env.example .env   # env values are pre-filled for the existing Hercules-managed Convex
pnpm dev               # http://localhost:5173
```

## Build

```bash
pnpm build             # tsc -b && vite build
pnpm preview
```

## Environment

| Variable | Meaning |
| --- | --- |
| `VITE_CONVEX_URL` | Convex deployment URL (backend + data). Currently points at the Hercules-managed deployment, so this clone shares the same live data and auth as the original app. |
| `VITE_HERCULES_OIDC_AUTHORITY` | OIDC issuer for Hercules Auth. |
| `VITE_HERCULES_OIDC_CLIENT_ID` | OAuth client id for the app. |

> Note: `convex/auth.config.ts` expects `HERCULES_OIDC_AUTHORITY` / `HERCULES_OIDC_CLIENT_ID`
> at Convex-deploy time; they are only needed if you push function code to a new Convex
> deployment (`npx convex env set ...`). The deployed functions already run on the
> Hercules-managed Convex.

## Deploy to Vercel

Framework preset **Vite**. Add the three `VITE_*` variables above as project
environment variables, then deploy. Convex functions keep running on the existing
deployment — no backend redeploy needed.
