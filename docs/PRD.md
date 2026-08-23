# ScoreSnap — Product Requirements Document

| | |
|---|---|
| **Status** | v1.0 — agreed baseline |
| **Date** | 2026-08-23 |
| **Owner** | David Inoa |
| **Design source** | [ScoreSnap Flow canvas](https://claude.ai/design/p/68917e4f-5f08-4559-ba50-80be59755b69?file=ScoreSnap+Flow.dc.html) |

---

## 1. Summary

ScoreSnap turns a photo of a paper chess scoresheet into a verified digital PGN. It is a phone-first, installable web app (PWA). All image recognition runs **on-device and offline**; there are **no accounts, no servers, and no telemetry**. The product's core promise: *photo in, PGN out — and every move in that PGN is provably legal.*

## 2. Problem

After a club game you hold a paper scoresheet. Getting that game into Lichess, Chess.com, or a database means retyping 40+ moves of handwriting — tedious, error-prone, and boring enough that most games never get digitized. Existing scanning tools route photos through cloud AI services, which costs money, requires connectivity, and sends personal game data off the device.

## 3. Target user

- **User #1:** the author — a casual club player with an iPhone who wants to digitize their own games right after club night.
- **Secondary:** club mates handed the app link. Tone throughout is casual-club, not tournament-arbiter.
- The primary surface is the phone (capture and review happen where the paper is). Desktop is a responsive nice-to-have in v1; the bespoke desktop workspace is a fast-follow (§13).

## 4. Product principles (hard constraints)

1. **No cloud AI.** No LLMs, no vision APIs, no network inference calls. Small trained models that ship in the app bundle and run on-device (e.g., a compact CNN for handwritten chess symbols) are permitted.
2. **Offline-capable.** Capture → recognize → review → export works with zero connectivity after first load. The network is used only for explicit user actions (Open in Lichess / Chess.com) and app updates.
3. **On-device data.** No accounts, no sync, no telemetry of any kind. Games live on the device that scanned them; the user is told this plainly ("Scans stay on this device").
4. **Honesty over magic.** The app never silently guesses. A reading is auto-corrected **only** when chess legality leaves exactly one candidate; everything else is flagged for the human. A blurry photo produces a refusal, not a fabricated game.
5. **The user played the game.** Disambiguation UI always shows the actual sheet crop next to the candidates — human memory resolves coin-flips better than any prior.

## 5. Scope

### 5.1 MVP (v1)

| Area | In scope |
|---|---|
| Input | Handwritten scoresheets and screenshots of notation → full-game PGN; native camera capture; native photo-library import; "Add another page" for games longer than one sheet; typed/pasted entry (moves or whole PGN) |
| Recognition | English + Spanish algebraic notation, auto-detected per sheet; legality-checked at every ply; three-flag review model |
| Review | Mobile review screen: flag chips, move list, sheet-crop bottom sheets, board replay, re-scan |
| Export | Editable game details; Copy PGN; Download .pgn; Open in Lichess; Open in Chess.com; partial export for irreconcilable games |
| Library | On-device list with plain-text search, status badges, resume-review, per-game Copy PGN, Export all |
| Resilience | Blurry-photo error state; "use it anyway — flag everything"; typed fallback |

### 5.2 Explicitly deferred (see §13 for sequencing)

| Deferred item | Why |
|---|---|
| Board photo → FEN | A different computer-vision product (board detection + piece classification on arbitrary physical sets) hiding inside a menu tab |
| PDF import | Additional input surface; pdf.js is easy but not free |
| Printed book/magazine mode *as a claim* | May partially work through the same pipeline; not tested, not promised in v1 |
| Dark mode | Polish, not core |
| Opening-name detection in library | Cheap ECO lookup, but still surface area |
| Custom in-app camera (design 1h) | Native capture has better focus/exposure — image quality *is* recognition accuracy |
| Engine-assisted suggestion ranking | Stockfish-WASM is allowed under the constraints but biases toward "good" moves; club players play the 42% move |
| Automated structural repair (skipped/transposed-move search) | Genuinely fun search problem; v2 |
| Board-tap move entry | Typed text box covers the fallback need |
| Bespoke desktop three-pane workspace (design 1c) | Phone-first v1; desktop gets functional responsive layouts |

## 6. User flows

### Flow A — Scan a game (happy path)
1. **Scan** screen (design 1a shell): choose photo from library, take photo with native camera, paste image, or open typed entry.
2. Optional: **Add another page** — second photo's moves are concatenated onto the move list before the legality pass.
3. **Processing** (design 1b): visible stages — straighten & clean → read header → read moves (live progress + current guess) → legality-check → build PGN. Typical sheet ≈ 15 s; cancel at any time.
4. **Review** (design 1i pattern): flag chips summarize what needs attention; tapping a flag opens a bottom sheet with the sheet crop, ranked candidates, and "type it manually." Board replay available for sanity-checking.
5. **Export** (design 1d/1j): confirm game details, copy/download/open the PGN. Game auto-saves to the library on reaching this step.

### Flow B — Typed or pasted entry
One multiline text box accepting move text or a complete PGN, parsed by the same dialect + legality pipeline, landing in the same review screen. (This is also the app's PGN-import path.)

### Flow C — Unreadable photo
Error card (design 1f): read-rate honesty ("could read 9 of ~40 moves"), photo tips, and three exits — **Try another photo**, **Use it anyway — flag everything**, **Type the moves instead**. Nothing is saved unless the user proceeds.

### Flow D — Library
Browse/search saved games, resume unfinished reviews, copy any game's PGN, export the whole library as one .pgn file.

## 7. Functional requirements

### 7.1 Capture & input
- **F-1** Photo import via the native photo-library picker and native camera capture (file inputs; no getUserMedia in v1).
- **F-2** Accepted formats: JPG, PNG, HEIC; max 20 MB per photo. Pickers request JPEG so iOS transcodes HEIC automatically; a WASM HEIC decoder ships as fallback for files that arrive raw (e.g., AirDropped HEIC opened on desktop Chrome).
- **F-3** Paste-from-clipboard image input on platforms that support it.
- **F-4** "Add another page": a game may be composed of 2+ photos captured in sequence; move lists are concatenated before the legality pass. Pages cannot be reordered in v1 (capture order = game order).
- **F-5** Screenshots of digital notation are a supported input through the same pipeline.

### 7.2 Recognition pipeline (behavioral spec)
- **F-10** Processing exposes its stages to the user with per-stage progress and a live "currently reading" hint; cancellable at any point.
- **F-11** **Dialects:** English and Spanish algebraic notation, implemented as pluggable symbol→piece tables (`K Q R B N` / `R D T A C`). The recognizer must handle common handwritten variance: `×` for captures, `0-0`/`O-O` castling, fileless pawn captures (`ed4`), shorthand (`hg5`), promotions (`e8Q`, `e8=D`), sloppy case, and optional `+`/`#` marks.
- **F-12** **Dialect auto-detect:** the whole sheet is scored under each dialect (piece-letter frequency + legality fit — sheets are internally consistent); the winner is applied. A visible EN/ES chip in review allows manual override, re-running interpretation. This resolves the `R` collision (Rey vs Rook).
- **F-13** **Legality engine:** the pipeline maintains the board position and intersects each cell's visual candidates with the legal moves at that ply. Outcomes:
  - Exactly one legal reading → accepted. If the literal text was illegal but one legal correction exists (sheet says `N×c4`, but c4 holds your own bishop → `Nxe4`), it is accepted and marked with the green **auto-fixed** flag.
  - Multiple legal readings with a visual favorite below 90% confidence → amber **pick one** flag with ranked candidates.
  - Multiple legal readings that are visually indistinguishable → dashed **ambiguous** flag (e.g., `h6` vs `b6`).
- **F-14** **Ranking signal:** visual stroke similarity plus free, never-lying priors — a written `+` must give check, `#` must mate; opening-frequency tables may rank early plies. **No engine evaluation.** Auto-acceptance is never based on soft priors — only on legality uniqueness.
- **F-15** **Irreconcilable break:** when no candidate at a ply yields a legal continuation (skipped move, transposed pair, hallucinated line), the break point is marked; subsequent moves become unverified and editable. No automated structural repair in v1 — the user fixes by typing, or partial-exports (F-33).
- **F-16** Confidence threshold: any accepted reading below 90% visual confidence is flagged even when legally unique (matches the design's "confidence < 90% gets flagged").

### 7.3 Review
- **F-20** Mobile-first review screen per design 1i/3a: header with remaining-flag count, sheet-photo peek, horizontally scrollable flag chips, monospace move list with inline flag states, bottom-sheet resolution UI.
- **F-21** Every resolution sheet shows: the cropped sheet region for that move, ranked candidates with confidence, one-tap accept, and "type it manually" (legality-validated input).
- **F-22** Board replay with step controls (`⏮ ◀ position ▶ ⏭`) so the user can sanity-check the game; UI hint that a wrong-looking position usually means the misread move is just before it.
- **F-23** Re-scan action returns to capture without losing header metadata.
- **F-24** A game can be **saved to the library at any point** with unresolved flags (status: "N moves to review", resumable). The **✓ verified** badge and frictionless export require all flags resolved and the full sequence legal.
- **F-25** Desktop widths get a functional responsive layout of the same review screen in v1 (the bespoke three-pane workspace of design 1c is deferred).

### 7.4 Export & PGN correctness
- **F-30** Game-details card, read from the sheet header where possible, fully editable: White, Black, Result, Event, Site, Date, **Round**.
- **F-31** PGN output is standard-conformant:
  - Seven Tag Roster always emitted; unknown values use PGN conventions (`?`, `????.??.??`, result `*`).
  - `[Round]` is a proper tag (the sheet's "RD: 3" never gets folded into the Event string).
  - Movetext is **normalized English SAN regardless of input dialect** (`O-O`, `x` captures, `=Q` promotions, disambiguation like `Rad1` when required) — Spanish is an input language, not an output format.
- **F-32** Date parsing: handwritten `9/8/26`-style dates are interpreted per a **one-time day/month-order setting defaulted from device locale**; the parsed date is always displayed on the export screen for correction.
- **F-33** **Partial export:** a game with an irreconcilable tail can be exported up to the last verified move, with a PGN comment marking the truncation (e.g., `{ScoreSnap: moves 31+ unreadable on sheet}`) and the sheet's result token if known, else `*`.
- **F-34** Export actions: **Copy PGN** (primary), **Download .pgn**, **Open in Lichess** (no-auth import API; requires network; degrades to copy-with-explanation offline), **Open in Chess.com** (best-effort deep link; fallback: copy + open site).
- **F-35** Event and Site are pre-filled from the previous scan when the sheet header doesn't override them (club regulars scan from the same venue weekly).
- **F-36** Reaching the export screen auto-saves the game to the library.

### 7.5 Library
- **F-40** List of saved games: players, result, event, date, move count, and status badge (**✓ verified** / **N moves to review**).
- **F-41** Plain-text search over players and events; filters: All / Verified / Needs review.
- **F-42** Per-game actions: open, resume review, Copy PGN, delete game, **delete photo but keep PGN**.
- **F-43** **Export all**: single multi-game .pgn file of the entire library — positioned in the UI as the backup ritual.
- **F-44** Storage model: each game keeps a **compressed working copy** of its scan (~300 KB processed grayscale — enough for resume-review and sheet crops); the full-resolution original is discarded after the game is verified.
- **F-45** Durability: when running un-installed in a browser tab, the app shows a nudge explaining that installing to the home screen is the supported durable mode (Safari can evict tab storage after ~7 days of disuse); the app requests `navigator.storage.persist()`.

### 7.6 Settings (deliberately tiny)
- **F-50** Date order (day-first / month-first), notation override default, storage overview + clear data, install instructions. Nothing else in v1.

## 8. Non-functional requirements

- **N-1 Offline:** after first load, the full pipeline works with no connectivity (service-worker precache including models/WASM). Total cached payload budget ≤ 20 MB; recognition models ≤ 10 MB of that.
- **N-2 Performance:** a typical one-page sheet processes in ≈ 15 s on a recent iPhone; progress is always visible; cancel is always available. UI stays responsive during recognition (workers).
- **N-3 Privacy:** no network request ever carries user data. The only outbound calls are user-initiated share actions (F-34) and app-asset fetches.
- **N-4 Browser floor:** iOS Safari 16.4+ (installed PWA is the reference target); current evergreen Chrome/Edge/Firefox on desktop.
- **N-5 Accessibility baseline:** ≥ 44 px touch targets, WCAG AA contrast on flag colors, review flow operable without color perception (flags differ by shape/border, not color alone — the dashed ambiguous border already does this).
- **N-6 No telemetry:** accuracy and speed are measured in development against the fixtures corpus, never by instrumenting users.

## 9. Quality bar (acceptance criteria)

The MVP is *done* when, measured against the evaluation corpus:

1. A legibly handwritten club scoresheet goes **photo → verified PGN in under 2 minutes** with **≤ 5 manual interventions**.
2. **≥ 90% of moves are auto-accepted** (no touch) on a clean sheet.
3. **Zero silently-wrong exports**: every exported move is legal in sequence, and every below-threshold reading was surfaced as a flag (honesty is a hard requirement even where accuracy falls short).
4. The unreadable-photo path triggers on genuinely bad photos rather than fabricating games (spot-checked with deliberately bad captures).

### 9.1 Evaluation corpus (workstream)

Only a few real scoresheets exist today, so growing the corpus is scheduled work, not an assumption:

- Target: **≥ 20 sheets from ≥ 3 different hands**, varied pens/layouts/languages (must include Spanish-notation sheets).
- Source: own games + borrowed club-mates' sheets photographed at club nights.
- Capture protocol (mirrors the app's own tips): daylight or desk lamp, sheet flat, shot from above, sheet fills the frame.
- Storage: local `fixtures/` directory, **gitignored from day one** (real names/dates; the repo is public-ready). Each fixture pairs the photo with a hand-verified ground-truth PGN.

## 10. Design reference

The [design canvas](https://claude.ai/design/p/68917e4f-5f08-4559-ba50-80be59755b69?file=ScoreSnap+Flow.dc.html) is the visual source of truth. Screen mapping:

| Canvas | Role in v1 |
|---|---|
| 1a Upload | Adopted shell (sidebar layout), plus a grafted **"Type the moves"** entry point |
| 1b Processing | Adopted |
| 1c Desktop review workspace | Deferred (v1.x); v1 desktop uses responsive mobile layout |
| 1d Export | Adopted |
| 1e FEN result | Deferred with board→FEN |
| 1f Error | Adopted |
| 1g Library | Adopted minus Positions filter and opening names |
| 1h Mobile capture | Superseded in v1 by native capture; the guided viewfinder returns in v2 |
| 1i / 1j / 3a Mobile review & result | Adopted (3a's interaction model: Done gated on flags, bottom-sheet fixes) |
| Logo / palette / type | Adopted: pawn-in-scan-brackets mark, green/mint variants, Young Serif + Hanken Grotesk + Spline Sans Mono |
| Dark mode (t4) | Deferred |

## 11. Technical constraints (product-level)

Implementation choices belong to a later architecture doc; these constraints are product promises:

- Installable **offline-first PWA**; static hosting; **no backend of any kind**.
- Recognition runs entirely in the browser: classical CV for dewarp/segmentation (OpenCV.js-class), a small bundled on-device model for handwritten symbol candidates (ONNX Runtime Web / TF.js-class), and a chess-rules library for the legality engine (chess.js-class).
- Likely app stack: TypeScript + Vite + React — placeholder, not a commitment.
- Distribution: static host + "Add to Home Screen"; no app-store wrapper in v1.

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Handwriting recognition accuracy without cloud models** — the existential risk | M0 spike before any app UI is built; legality constraints do heavy lifting (the candidate space at any ply is ~30 moves, not 26 letters × 8 digits); typed fallback always exists; the honesty principle means weak accuracy degrades to "more flags," never wrong PGNs |
| R2 | iOS evicts browser storage → library loss | Install nudge (F-45), `storage.persist()`, Export-all positioned as backup ritual; post-v1: user-owned auto-backup (§13) |
| R3 | Corpus too small to trust the accuracy claims | §9.1 workstream is scheduled; acceptance bar is only measurable once corpus v1 exists |
| R4 | Sheet-layout variance across clubs breaks segmentation | Layout-agnostic segmentation goal in M0; corpus deliberately varied |
| R5 | Model + WASM payload bloats offline cache | N-1 budget enforced; model size is an M0 selection criterion |
| R6 | "ScoreSnap" name collision if the app goes public | Check before public release; name is explicitly changeable |

## 13. Milestones

Gates, not dates (solo project):

- **M0 — Recognition spike (go/no-go).** Pipeline prototype against existing fixtures: dewarp → segment → symbol candidates → legality beam. Deliverable: measured raw vs. legality-boosted accuracy, model + payload sizes. *Gate: a credible path to the §9 bar.*
- **M1 — Core flow, English.** Capture (native) → processing → review → export happy path; PGN correctness (F-31); auto-save.
- **M2 — Dialects & edge paths.** Spanish + auto-detect, typed entry, error path, add-another-page, partial export.
- **M3 — Library & durability.** Storage model, search, resume, Export all, install nudge, settings.
- **M4 — Ship v1.** Visual polish per canvas, corpus-validated acceptance run, static deploy.
- **Post-v1 backlog (rough order):** user-owned auto-backup (Files/iCloud via share sheet, or a File System Access API folder — patches R2 with zero backend) → desktop workspace (1c) → dark mode → custom guided camera (1h) → PDF import → engine-assisted ranking → automated structural repair → board→FEN (1e) → opening names → board-tap entry → E2E-encrypted sync service + shared club library (deliberate product expansion; see [ADR-0001](./adr/0001-client-only-architecture.md)).

## 14. Open items (tracked, non-blocking)

- Model approach (train tiny CNN vs. adapt existing OCR) — decided by M0 evidence.
- Opening-frequency prior data source (small embedded table; scope in M1).
- Whether printed-book input "just works" through the handwriting pipeline — test during M2, promote to a claim only if the corpus says so.
- Chess.com deep-link reliability — verify during M1; fallback already specced (F-34).

---

## Appendix A — Decision log

Decisions from the PRD interview (2026-08-23), for future archaeology:

| # | Decision |
|---|---|
| Q1 | "No AI" = no cloud/LLM/API inference; on-device bundled models allowed |
| Q2 | Phone-first installable PWA; user #1 is the author; no-sync consequence accepted |
| Q3 | MVP cutline per §5 (board→FEN, PDF, book-mode-as-claim, dark mode, opening names deferred) |
| Q4 | English + Spanish notation, pluggable dialect tables |
| Q5 | Upload shell 1a + grafted "Type the moves" door |
| Q6 | Acceptance bar per §9; corpus ≥20 sheets / ≥3 hands |
| Q7 | Flag-and-edit + partial export; no auto structural repair; never hard-fail-only |
| Q8 | Name ScoreSnap; git repo; PRD at docs/PRD.md; tech constraints included |
| Q9 | Ranking = visual + free priors (+/# marks, opening frequency); no engine; auto-fix only on legality uniqueness |
| Q10 | Compressed working copy per game; originals discarded after verify; install nudge + Export-all backup |
| Q11 | "Add another page" concatenation in MVP |
| Q12 | Native capture + native picker; custom viewfinder v2; HEIC via iOS transcode + WASM fallback |
| Q13 | Per-sheet dialect auto-detect with EN/ES override chip |
| Q14 | Typed entry = one text box through the same pipeline (free PGN import) |
| Q15 | Proper [Round] tag; locale-defaulted date-order setting; remember last Event/Site |
| Q16 | Corpus partially exists → grow-corpus workstream; repo private now, public-ready; fixtures gitignored; MIT when public |

Defaults accepted without objection: no telemetry ever; static hosting + Add to Home Screen; Lichess via no-auth import API and Chess.com best-effort deep link with copy fallback.
