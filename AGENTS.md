<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Git workflow

- Never `git commit` or `git push` unless the user explicitly asks for it.
- After every piece of development work, end with a ready-to-use commit title
  in this repo's style (`feat: …`, `fix: …`, `docs: …`) so the user can commit
  it themselves.

# Project

- Frontend only. All data comes from the Rust API (`../dwi-api`); there is no
  database or ORM here. `src/lib/api.ts` is the only server-side client.
- The admin's API token lives in an httpOnly cookie and is read only on the
  server. Do not pass it to client components; the live stream goes through
  `src/app/api/live/[id]/route.ts`.
- `apps/scanner` is a separate Vite PWA with its own `bun.lock`; root
  tsconfig/eslint exclude it.
- UI copy is Indonesian.
- Verify: `bun run lint && bun run typecheck && bun run build`, plus
  `bun run cf:build` for the Cloudflare bundle. If Turbopack fails to resolve
  `next/font`, delete `.next` (stale cache) and rebuild.
