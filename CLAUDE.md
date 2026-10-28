# CLAUDE.md — Adventure Book

A romantic, interactive scrapbook of a couple's dates. Since v2 it is a **shelf of books**, and each
book is **one continuous, horizontally scrolling paper diorama**: every page is a *stop* along a dotted
path through a layered paper-cut landscape that changes with each stop's theme. Public to read;
editable only by the couple, with one shared password, directly inside the book.

> **UI language:** Bahasa Indonesia, casual, as short as possible. Code, comments and docs: English.
>
> **Design record:** `docs/superpowers/specs/2026-10-28-adventure-book-v2-design.md` (decisions and
> rationale). This file is the operative summary; the code named here is the source of truth.

---

## 1. Product

- **Shelf** (`/`): the couple's books stand face-out on a paper shelf. Editors get a ghost book with ＋
  to start the next volume (title + theme). A book with no stops can be deleted from its settings.
- **Book = one world** (`/book/[slug]`):
  - **Cover overlay**: felt board, stitched spine, die-cut window showing the cover photo. Shown once
    per session per book (`sessionStorage ab-opened:<slug>`), skipped for deep links.
  - **Start sign**: title, `vol. N`, the date it began.
  - **Stops**: one per `Page`, in `Page.order`. Each stop has a template (fixed frames) and a theme
    (palette + asset kit). Decorations are placed automatically; the dice reshuffles them.
  - **Month signposts**: inserted automatically wherever the month changes between dated stops.
  - **End**: a "bersambung" sign with stats (`N halaman · M kenangan`, date range) and the closing
    text, up to three open wishes as signposts, and a back cover.
- **Readers** need no login. **Editors** unlock once per shelf and edit in place (§6).
- Companions: `/map` (where photos and videos were taken) and `/wishlist` (things to do together).

Non-goals: free-canvas positioning, per-sticker placement, user accounts, comments, real-time
collaboration, offline mode, PDF export, a 3D page flip.

---

## 2. Tech stack

- **Next.js 15** (App Router, Server Actions, Route Handlers), **React 19**, TypeScript strict
- **Prisma 6** + **PostgreSQL** (Homebrew, local on the Mac mini)
- **Tailwind CSS 4**; fonts via `next/font`: **Caveat** (captions, titles, stamps), **Kalam**
  (stories, letters), **Inter** only for UI chrome
- **sharp** (images), **exifr** (EXIF GPS + capture time), **ffmpeg/ffprobe** (video, Homebrew)
- **jose** (session JWT), **bcryptjs** (password hash), **zod** (every input)
- **leaflet** + **react-leaflet** (map), **@dnd-kit** (reordering stops)
- **Vitest** (pure logic), **Playwright** with the system Chrome (E2E, visual, parity)
- v1-only, kept with the v1 code until it is removed (§10): `framer-motion`, `react-pageflip`
- Deploy: **PM2** + Caddy gateway + **Tailscale Funnel** on a **Mac mini M4** (§14). Media on local
  disk, no cloud storage.

---

## 3. Domain model

`prisma/schema.prisma` is the source of truth. Migrations are **additive only**.

- **Shelf**: `title`, `editPasswordHash` (the one password), books, wishlist.
- **Book**: `slug`, `title`, `subtitle`, `theme` (v2 theme key; legacy values are mapped), `volume`,
  `shelfId`, `shelfOrder`, cover (`coverImageUrl`, `coverFocusX/Y`, `coverText`), `closingText`.
- **Page** (a stop): `order` (contiguous, 0-based), `template` (v2 key; null = derived), `theme`
  (null = follows the book), `decorSeed`, plus the legacy `layout` enum.
- **Slot**: `key` (`photo1..3`, `video1`, `text1`), `type`, media (`imageUrl`, `thumbUrl`, `videoUrl`,
  `width`, `height`), crop focus (`focusX/Y`, 0..1), `caption`, `text`, dates (`takenAt` from the file,
  `dateLabel` written by the couple, `showDate`), location (`lat`, `lng`, `locationLabel`,
  `locationSource` = `"exif" | "manual"`).
- **WishlistItem**: `text`, `done`, `doneAt`, `order`, `shelfId` (v2) and `bookId` (v1; v2 files new
  wishes under the shelf's first book too).

Rules the code relies on:

- Writing a template also writes the matching legacy `layout` (`TEMPLATES[t].legacy`), so the v1 app
  keeps rendering every page.
- Switching templates keeps every slot row: slots the new template has no place for are hidden, and
  come back when switching back. Anything a reader can notice — stats, month signs, map pins — counts
  only **shown** slots that **have their media**: `visibleSlots()` / `hasMedia()` in
  `lib/v2/visible.ts`.
- v1 `COVER`/`CLOSING` pages are not stops; their content was copied into the Book fields above.
  v2 keeps them at the two ends of the order.
- `reorderStopsV2` rewrites the whole order in one transaction.

---

## 4. Templates, themes, decorations

All geometry is in **design units (u)**: every stop is 720u tall and `TEMPLATES[t].width` wide; the
ground band starts near 560u and the path runs at 642u.

- **`lib/v2/templates.ts`** — the 12 templates (frames with ratio, window size, card position and
  fixed rotation; text box; decoration anchors; date-stamp anchor; picker glyph), plus
  `slotSpecs()`, `deriveTemplate()` (legacy layout + real photo shape → template) and
  `resolveTemplate()`.

  | key | label | legacy |
  |---|---|---|
  | `single-tall` / `single-wide` | Satu foto tegak / lebar | SINGLE |
  | `duo-side` / `duo-stack` | Dua foto berdampingan / bertumpuk | DUO |
  | `trio` | Tiga foto | TRIO |
  | `photo-text` | Foto + cerita | PHOTO_TEXT |
  | `duo-text` | Dua foto + cerita | DUO_TEXT |
  | `strip-text` | Strip photobooth + cerita | TRIO_TEXT |
  | `video-tall` / `video-wide` | Video tegak / lebar | VIDEO |
  | `letter` | Surat | TEXT |
  | `quote` | Kutipan | QUOTE |

- **The template decides the frame shape**; photos are cropped (`object-fit: cover`) at the slot's
  focus point. There are no per-photo formats, tilt sliders or tape pickers in v2. Notes and letters
  clamp to their line limits; captions are one line.
- **`lib/v2/themes.ts`** — five themes, each four analogous shades plus one accent: `stroberi`
  (romantis), `senja` (jalan-jalan), `matcha` (kafe & makan), `laut` (liburan), `lavender` (malam).
  Legacy keys map `cream → stroberi`, `dusk → lavender`, `kraft → senja`. `themeCssVars()` exposes
  the tokens as CSS variables.
- **`components/world/themes/<key>.tsx`** — each theme's kit: sky / mid / ground / front layer art,
  sticker pools per anchor kind (`sky`, `side`, `ground`) and how photos are mounted (bow, kraft tape,
  corner tapes, striped tape, dotted tape). All hand-authored SVG.
- **`lib/v2/decor.ts`** — `placeDecorations(anchors, pools, pageId, decorSeed)`: a seeded choice per
  anchor (about 30% left empty, small jitter). Same inputs, same page, always. Anything random in the
  art goes through `lib/v2/rng.ts`, seeded by ids.
- In SVG, put theme colours in `style` (`style={{ fill: "var(--c3)" }}`); `var()` in presentation
  attributes is not reliable.

---

## 5. World renderer (`components/world/`)

**One renderer** draws the reader, the editor, the all-pages tiles and the dev gallery
(`WorldCanvas`, `StationScene`, `Station`, `items/*`). The editor only adds overlays, which is what
keeps the preview identical to the reader; `e2e/parity.spec.ts` compares the pixels.

- **Scale**: `s = min(viewportHeight / 720, viewportWidth / 460)` px per u (`lib/v2/scale.ts`),
  exposed as `--u`.
- **Layout** (`lib/v2/world.ts`, pure and unit-tested): start (420u) · stops · month signs (180u) ·
  end (880u), with 90u gaps. Every segment owns one scenery slice; slices tile the world exactly, and a
  theme change always falls in a gap. The sky colour crossfades over ±260u.
- **Layers and parallax**: sky 0.22, mid 0.55, ground 1, front 1.16, written by one
  rAF-throttled scroll handler. Slice art is drawn on a global grid (`lib/v2/shapes.ts`) so
  neighbouring slices meet without a seam; clips overlap by 0.75u. Slices use
  `content-visibility: auto` with padded boxes (paint containment clips anything that overhangs).
- **Navigation**: native horizontal scroll (momentum, no snap); a vertical wheel scrolls sideways on
  desktop; ←/→ jump stop to stop; a timeline strip with a dot per stop. Deep links `?p=<pageId>` and
  `?page=<order>` start at that stop and skip the cover.
- **Chrome** (icons only): shelf, map, wishlist, share (the shared link drops the `v` parameter),
  music toggle (`public/audio/paper-lanterns.mp3`), pencil to edit.
- **Video stops**: poster + play icon; tap plays inline (`playsInline`, `preload="none"`); paused when
  scrolled away.
- **Motion and a11y**: with `prefers-reduced-motion` every parallax factor is 1 and transitions are
  instant. The world is a labelled scroll region; each stop is `section[data-page]` labelled
  `Halaman N`; photo `alt` = caption or `foto kenangan`.

---

## 6. Editor (`components/editor-v2/`)

`/book/[slug]/edit` renders the same world with edit overlays (`EditorWorld`).

- **Select by tapping**: a stop's empty space selects the stop; a photo selects its slot; a caption or
  note opens an inline editor exactly over the text (same font, size and width). Esc deselects.
- **Top bar**: done, undo, save status (saved / saving / warning — tap the warning to retry), all
  pages (real-render tiles; drag to reorder, tap to jump), book settings (title, vol., cover photo and
  its focus, cover note, closing text, book theme, delete an empty book).
- **Dock** (one bar, changes with the selection):
  - stop: template · page theme ("ikut buku" or one of five) · shuffle decorations · delete
  - photo / video: replace · focus (drag the photo inside its frame) · caption · date · location · clear
  - note: write · clear
- **＋ on the path** in every gap opens the add sheet: many photos/videos at once (uploaded two at a
  time, grouped per day into suggested stops by `lib/v2/bulk.ts`, reviewed, created in one
  transaction), or one empty stop by template.
- **Saving** (`useEditorBook.ts`): every change applies locally at once, goes to the server through
  one ordered queue, and pushes an inverse on the undo stack. Each queued call reads the **latest**
  state when it runs, so a retry never writes an older value over a newer one. Failed calls are kept
  and re-run from the warning button. Deletes are undone by restoring the server's snapshot (same id,
  same position); undoing a delete that never reached the server simply drops it. Creating stops is
  never retried automatically (the add sheet keeps its batch).
- **No confirm dialogs anywhere** — undo instead.
- **Replace / clear rules**: a new file resets focus, size and `takenAt`; its EXIF location replaces a
  location that came from EXIF (or clears it). A pin the couple placed by hand (`locationSource =
  "manual"`) is never changed by a file — enforced in the editor and again in `updateSlotV2`. Clear
  removes the file and what was read from it, and keeps the manual pin, the place label and the
  written date.

---

## 7. Access and auth

- One password per shelf (`Shelf.editPasswordHash`). The shelf took its hash from the original book,
  so the password did not change; new books copy the shelf's hash.
- `POST /api/session` `{ slug, password }`: checks the shelf's hash (the book's own if it is on no
  shelf), then sets `ab_session` — httpOnly, `Secure` in production, `SameSite=Lax`,
  **`Path=/adventure`**, 30 days — holding a jose HS256 JWT `{ bookId, shelfId?, role: "editor" }`.
  The same error for a wrong password and an unknown slug. Rate-limited to 5 tries / 5 min per IP
  (`lib/rate-limit.ts`, in memory). `DELETE /api/session` clears it.
- `lib/auth.ts`: `canEditBook(bookId)` (the token's book, or any book on the token's shelf),
  `requireEditor(bookId)`, `requireShelfEditor(shelfId)`, `getEditorShelfId()`. A v1 token (no
  `shelfId`) counts for its book's shelf only while the shelf's hash equals that book's hash.
- **Every mutating Server Action and the upload route check first, before any DB or disk side
  effect.** Public read routes never check auth.

---

## 8. Uploads and media

`POST /api/upload` (editor only):

1. Validate server-side: images `jpeg/png/webp/heic` ≤ 12MB; videos `mp4/quicktime/webm` ≤ 200MB.
2. **Read metadata before re-encoding strips it**: photos — EXIF GPS (`exifr.gps`) and capture time
   (`DateTimeOriginal` / `CreateDate`); videos — `ffprobe` `creation_time` and the QuickTime ISO 6709
   location. Missing or malformed metadata never fails an upload.
3. Images (`lib/images.ts`): sharp `rotate()` → ≤ 1600px webp q82 + ≤ 400px thumb q70. Never call
   `.withMetadata()`: the stored file carries no EXIF/GPS; coordinates live only in the DB.
4. Videos (`lib/video.ts`): `ffmpeg -map_metadata -1 -c:v h264_videotoolbox -b:v 4M
   -vf "scale='min(1280,iw)':-2" -c:a aac -b:a 128k -movflags +faststart`, then a poster frame →
   webp + thumb.
5. Response: `imageUrl` (poster for video), `thumbUrl`, `videoUrl?`, `width`, `height`, `lat`, `lng`,
   `takenAt`.

Files live in `UPLOAD_DIR` (this repo's `./uploads`, gitignored — **irreplaceable, back it up
separately**) under random UUID names. The DB stores route paths with the base path
(`/adventure/api/media/<file>`), never disk paths or original filenames.
`GET /api/media/[...path]` streams them with long-lived cache headers and **HTTP range support**
(`206 Partial Content`), which video seeking and iOS playback need.

---

## 9. Routes

| Path | What |
|---|---|
| `/` | the shelf (v1: redirect to `/book/$DEFAULT_SLUG`) |
| `/book/[slug]` | the world reader; `?p=<pageId>`, `?page=<order>` |
| `/book/[slug]/edit` | the editor (redirects to unlock without a session) |
| `/book/[slug]/unlock` | password card |
| `/map` | every book's shown photos and videos that have coordinates; a pin opens `/book/<slug>?p=<pageId>` |
| `/wishlist` | the shelf's wishlist (also wishes v1 filed under one of its books); read-only for visitors |
| `/book/[slug]/map`, `/book/[slug]/wishlist` | redirect to `/map`, `/wishlist` (v1 pages under `?v=1`) |
| `/dev/gallery` | every template × theme, for development; 404 in production |
| `/api/session`, `/api/upload`, `/api/media/[...path]` | §7, §8 |

Server Actions: `actions/v2/editor.ts` (slots, templates, themes, seeds, create / delete / restore /
reorder stops, book settings) and `actions/v2/shelf.ts` (new book, delete empty book, wishlist).

Map tiles (`lib/mapTiles.ts`): Stamen Watercolor via Stadia with `NEXT_PUBLIC_STADIA_API_KEY`
(domain-restricted key; Stadia returns 401 from non-localhost hosts without one), otherwise plain OSM
tiles. Keep the attribution visible — it is a licence requirement.

---

## 10. Feature flag, v1, rollback, deferred cleanup

- `lib/v2/flag.ts`: v2 serves when `ADVENTURE_V2=1` (server env, read per request) or with `?v=2`;
  `?v=1` forces the old app. `v2Suffix()` keeps `?v=2` on internal links only while it is a preview.
- **The v1 app is still in the tree as the instant rollback**: `components/{reader,editor,map,
  wishlist,ui}`, `actions/{book,pages,slots,wishlist}.ts`, `lib/{layouts,frames,tapes,themes,
  types}.ts`, `app/book/[slug]/wishlist/edit`. Do not extend it. Removing it (and `framer-motion`,
  `react-pageflip`) is a follow-up once the couple have confirmed v2.
- **Rollback**: remove `ADVENTURE_V2` from `.env`, then `pm2 restart adventure-book` (Next reads
  `.env` at every start; keep the flag out of PM2's own env so this keeps working). The database stays
  compatible both ways (v2 keeps `layout` in sync; v1 ignores the new columns).
- **Deferred destructive cleanup — only with the user's explicit OK**: drop `Slot.rotation`,
  `Slot.tapeStyle`, `Slot.aspect`, `Page.bgStyle`, `Book.editPasswordHash`, `WishlistItem.bookId`,
  the `COVER`/`CLOSING` pages and enum values.

---

## 11. Development and tests

- **Never develop or test against the live database or the live `uploads/`.** Work on a copy: database
  `adventure_book_v2dev` (a `pg_dump` of the live one; the admin database is `template1` — there is no
  `postgres` database), its own uploads copy, and `next dev -p 3012`. The redesign was built in the
  worktree `../adventure-book-v2` (branch `v2`) set up exactly this way.
- The copy's edit password is a test-only one (`dev-test-password`, set only on the copy;
  `E2E_EDIT_PASSWORD` overrides it).
- `npm test` — Vitest, `lib/**/*.test.ts`, pure logic (templates, world layout, dates, decorations,
  bulk grouping, edits, visibility, backfill planners).
- `npx playwright test` — needs the dev server on :3012; one worker, because the suites share the dev
  database and edit it (each test puts back what it changes). `playwright.config.ts` refuses to run
  against the live app. Specs: `gallery` (visual snapshots; dev server only), `reader`, `editor`
  (including failed saves and undo), `parity`, `add-many`, `shelf`.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` must pass before merging.
- **Real photos never go into the repo** (it has a GitHub remote): test images are generated with
  sharp.
- **Never run `npx prisma db seed` against real content** — it wipes the pages.
- Backfill (idempotent; `--dry-run` prints the plan; refuses any database other than
  `adventure_book_v2dev` without `--allow-prod`):
  ```
  npx tsx --env-file=.env scripts/v2/backfill.ts <media-dims|taken-at|templates|book-parts|shelf|all> [--dry-run] [--allow-prod]
  ```

---

## 12. Conventions and guardrails

- TypeScript strict, no `any`. Validate every Server Action and route input with zod.
- Prisma client singleton in `lib/db.ts`.
- `requireEditor` / `requireShelfEditor` before any side effect.
- Captions, notes and wishes are plain text — rendered as text, never as HTML.
- **UI**: prefer an icon over text (`components/v2/Icon.tsx`: 24px grid, 2px round strokes,
  `currentColor`); text only for content or where an icon would be ambiguous. **No emoji in UI
  chrome or system copy** (the couple's own captions may contain them). Every icon-only control has
  `aria-label` and `title` (`IconButton` sets both). Visible focus states on every control.
- **The editor preview must equal the reader**: change rendering in `components/world/` only, never
  fork it for the editor; run the parity test.
- Keep `Page.layout` in sync with `Page.template`, keep `Page.order` contiguous, migrations additive.
- Respect `prefers-reduced-motion`; `alt` text everywhere.
- Hand-written paths (fetch calls, media URLs) go through `withBase()` from `lib/basePath.ts`;
  `next/link` and the router add the base path themselves.
- Don't hardcode slugs or passwords; secrets stay out of the repo.

---

## 13. Environment variables

```
PORT=3002                   # app port (dev server for the copy: 3012)
BASE_PATH=/adventure        # served under a subpath on the shared Funnel hostname
NEXT_PUBLIC_BASE_PATH=/adventure
DATABASE_URL=postgresql://.../adventure_book
SESSION_SECRET=             # jose HS256 secret (long random)
UPLOAD_DIR=                 # persistent media folder: this repo's ./uploads (gitignored)
DEFAULT_SLUG=our-story      # v1 landing redirect / fallback
SEED_EDIT_PASSWORD=         # only for prisma/seed.ts on a fresh database
NEXT_PUBLIC_STADIA_API_KEY= # optional, domain-restricted watercolor tiles
ADVENTURE_V2=1              # serve v2 by default; unset = v1 (rollback)
```

---

## 14. Deployment (Mac mini M4)

The app is served under **`/adventure`** on the shared Funnel hostname
`jafars-mac-mini.tail9e540f.ts.net` (other apps live on the same host).

- Runs on **port 3002** (`next dev -p 3002` / `next start -p 3002` in `package.json`); `basePath` comes
  from `BASE_PATH` in `next.config.ts`. Check `lsof -i :3002` before a first start.
- **Cookie scope**: `ab_session` with `Path=/adventure`, so other apps on the hostname never see or
  clobber it. Funnel is always HTTPS, so the cookie stays `Secure`.
- **PM2**: `PORT=3002 pm2 start npm --name adventure-book -- start`, then `pm2 save`.
- **Gateway**: Funnel forwards everything on :443 to a shared Caddy on :8080
  (`tailscale funnel --bg 8080`), which routes by path with the URI untouched
  (`~/Koding/_gateway/Caddyfile`: `@adventure path /adventure /adventure/*` →
  `reverse_proxy 127.0.0.1:3002`). Never add a `tailscale funnel --set-path` mount — it strips the
  prefix and fights the gateway. A new app on the host = a port, a matching basePath, one
  matcher+handle pair, `caddy reload`.
- **Boot persistence**: Caddy runs as the PM2 app `gateway`; `gateway`, `adventure-book` and
  `signum-web` come back via `pm2 resurrect`, started at boot by the LaunchDaemon
  `/Library/LaunchDaemons/com.PM2.daemon.plist` (user `jafarfadli`, `RunAtLoad` + `LaunchOnlyOnce`).
  After changing which apps PM2 manages, run `pm2 save`.
- **Redeploy** (code only): `npm run build && pm2 restart adventure-book`. A plain restart also picks
  up `.env` edits.
- **Release with database changes**:
  1. Back up first: `pg_dump` to a dated file outside the repo, and copy `uploads/`
     (`~/adventure-book-backups/<YYYY-MM-DD-HHMM>/`).
  2. `npm install`, `npx prisma migrate deploy`, then `npx prisma generate` (npm 11 skips package
     install scripts, so the client is not regenerated on its own).
  3. Run any needed backfill with `--allow-prod` (dry-run first).
  4. `npm run build && pm2 restart adventure-book`, then check the public URL.
- `UPLOAD_DIR` and the database dumps belong in the backup routine — the photos are irreplaceable.

Public URL: `https://jafars-mac-mini.tail9e540f.ts.net/adventure`.
