---
status: accepted
date: 2026-09-15
---

# Cloudflare Worker as static SPA delivery

ScoreSnap is delivered from a **Cloudflare Worker** that serves the TanStack Start SPA shell (`_shell.html`) and static assets. The Worker is hosting plumbing, not an application backend. Recognition, review, and the game library still run only on the device ([ADR-0001](./0001-client-only-architecture.md)).

## Context

Issue #4 originally specified Cloudflare **Pages**: `pnpm build`, publish `dist/client`, SPA fallback via `_redirects` (`/* /_shell.html 200`). GitHub Actions would stay a quality gate.

Connecting the GitHub repo through Cloudflare's Workers & Pages UI did not take that path. The platform detected TanStack Start, ran `npx wrangler deploy`, and auto-scaffolded a Worker **on the build VM**. That deploy succeeded (`https://score-snap.davidinoa.workers.dev`) but left no Wrangler config in git, so the next build could re-run the wizard.

Two follow-ups were considered:

- **Static Pages + `_redirects`.** Closest to ADR-0001's "no server." Cannot grow a backend by accident. Would fight Cloudflare's TanStack detector and require a later cutover if sync ever lives on Workers.
- **Commit the Worker adapter.** Repeatable deploys; TanStack's first-class Cloudflare plugin; the host ADR-0001 already named for a hypothetical sync service.

## Decision

Commit `wrangler.jsonc` and `@cloudflare/vite-plugin`. Cloudflare's Git integration deploys that Worker. GitHub Actions remains a **quality gate only** (no deploy workflow).

v1 constraints on that Worker:

- SPA mode stays on (`tanstackStart({ spa: { enabled: true } })`).
- No `createServerFn`, server routes, or SSR of user data.
- No storing scans, PGNs, or identities on Cloudflare (KV, D1, R2 used as a product database).
- Recognition stays on-device (PRD principle #1).
- Wrangler `observability` is off (PRD N-6). Platform-level anonymous Wrangler telemetry is Cloudflare's, not ours.

If E2E-encrypted sync is ever added, it extends **this** Worker behind the storage facade (ADR-0001). That is a new product decision, not an implied permission from this ADR.

## Consequences

- `wrangler.jsonc` is the source of truth; Git-triggered deploys stop inventing config on the builder.
- Preview URLs and `workers.dev` come from Wrangler (`preview_urls`, `workers_dev`).
- The Worker `main` is `@tanstack/react-start/server-entry` because that is how Start's Cloudflare adapter serves the shell. It is not a license to add application APIs.
- `nodejs_compat` is required by the adapter (TanStack hosting skill).
- Local `pnpm deploy` is optional; production still ships via Cloudflare's Git integration.
