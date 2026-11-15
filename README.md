# dwi-web

Frontend for the DWI wedding invitation platform. It contains no database:
everything comes from the Rust API ([`dwi-api`](../dwi-api)).

```
src/                Next.js 16 app (admin dashboard; invitation pages come next)
  lib/api.ts        server-only client for dwi-api; session token in an httpOnly cookie
  proxy.ts          sends /admin/* to /login when there is no session
  app/api/live/     relays the API's live stream (SSE) to the browser
apps/scanner/       door scanner PWA (Vite + React), own bun.lock
```

## Run locally

Start `dwi-api` first (see its README; `cargo run -- seed-demo && cargo run`).

```bash
bun install
cp .env.example .env.local        # API_URL=http://localhost:8080
bun run dev                       # http://localhost:3000 → admin@demo.local / demo password

bun run scanner:dev               # the scanner, http://localhost:5173
```

The scanner talks to the API when `apps/scanner/.env.local` sets `VITE_API_URL`.
Without it, the scanner runs the offline Alex & Ajeng demo.

## What's here

| Page | |
| --- | --- |
| `/login` | Email + password against the API; the token is stored as an httpOnly cookie |
| `/admin` | Events you can access, with your role |
| `/admin/events/[id]` | Live attendance: totals, per-door counts, latest arrivals, and a live feed (SSE) |
| `/admin/events/[id]/scanner` | Pairing codes (create/revoke) and door devices (revoke) |
| `/admin/password` | Replace a temporary password |

Not here yet: the public invitation pages (`/e/[slug]`, `/v/[slug]`) and the
rest of the admin (guests, RSVP, content editing). The original app keeps
serving those until they are ported.

## Verify

```bash
bun run lint && bun run typecheck && bun run build
bun run cf:build                   # Cloudflare Worker bundle (OpenNext)
bun run --cwd apps/scanner build
```

If Turbopack can't resolve `next/font`, delete `.next` and rebuild (stale cache).

## Deploy

**Web → Cloudflare Workers** with [OpenNext](https://opennext.js.org/cloudflare).
It needs Next ≥ 16.4.5, which is why this repo is ahead of the original app's 16.3.6.

```bash
bunx wrangler login
bun run cf:preview                 # build + run locally in workerd (uses .dev.vars)
bun run cf:deploy                  # build + deploy
```

Set `API_URL` in `wrangler.jsonc` `vars`, or in the Cloudflare dashboard per
environment. The live stream works on the Workers runtime (tested with
`wrangler dev`). Each open dashboard holds one streaming request.

**Scanner → any static host.** `apps/scanner/dist` is plain files. Set
`VITE_API_URL` at build time. On Vercel, the project's Root Directory is
`apps/scanner` and the Ignored Build Step is `bash ../../scripts/vercel-ignore.sh .`.
On Cloudflare Pages, the build command is `bun run build` with output `dist`.
Either way, add the scanner's origin to the API's `CORS_ORIGINS`.
