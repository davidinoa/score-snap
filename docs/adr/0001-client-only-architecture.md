---
status: accepted
date: 2026-08-23
---

# Client-only architecture — no server, no database

ScoreSnap ships as a static, offline-first PWA: recognition, review, and the game library all run and live on the user's device, with no backend of any kind. We chose this because the product's core promises — recognition works offline, nothing leaves the device, zero recurring cost — are exactly the properties a server would erode, and because the core job (sheet → PGN → paste into Lichess) completes on one device.

## Considered options

- **Server + database from the start.** Would buy real things: durable backup (our weakest point — iOS can evict un-installed browser storage), phone→desktop sync, a shared club library, and a correction-data flywheel for improving the recognition model. Rejected for v1: offline-first stays mandatory regardless (club-venue connectivity), so a server _adds_ a sync protocol on top of client storage rather than replacing it; it also adds auth, recurring hosting cost, and a security/privacy surface (other people's real names on scanned sheets) — all carried by a solo maintainer, and all before the existential risk (recognition accuracy, milestone M0) is retired.
- **User-owned backup, no backend.** Auto-export to Files/iCloud Drive (share sheet) or a File System Access API folder. Captures most of the durability benefit with zero server. Backlogged post-v1 (PRD §13).

## Consequences

- The client-only design is a strict subset of a future server design: the storage service (SYSTEM_DESIGN §4.3) is the deliberate **sync seam** — an eventual sync engine bolts on behind that facade with PGN + compressed page blobs as the payload. Nothing built for v1 is wasted if sync arrives.
- Delivery is a Cloudflare Worker that **only serves the SPA shell and assets** ([ADR-0002](./0002-cloudflare-worker-delivery.md)). That is hosting, not a ScoreSnap backend. A future sync service would extend that Worker; v1 must not grow server functions or store user data there.
- If a server ever comes, the principle evolves from "nothing leaves the device" to "end-to-end-encrypted sync; recognition still on-device." Server-side _recognition_ stays off the table regardless (PRD principle #1).
- The correction-data flywheel (learning from user fixes across users) is the one benefit impossible without egress; it stays out unless an explicit opt-in consent model is designed first.
