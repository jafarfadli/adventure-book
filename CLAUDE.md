# CLAUDE.md — Adventure Book

A romantic, interactive "scrapbook" web app for capturing dating memories. Public to read, editable only by the couple behind a shared password. Photos live in template-based page layouts with hand-written captions, polaroid framing, and a gentle page-turn feel.

> **Target UI language:** Bahasa Indonesia (copy, buttons, labels). Code, comments, and this spec stay in English.

---

## 1. Product overview

- A single **Book** is a sequence of **Pages**. Each Page uses one of a fixed set of **layout templates** (no free drag-drop). A layout defines a set of **Slots** — each slot holds either a photo (+ caption) or a text block.
- **Readers** (public) open `/book/[slug]` and flip through pages. Read-only, no login.
- **Editors** (the couple) unlock editing with the book's password, then add/reorder/delete pages, choose layouts, upload photos, and write captions.
- Vibe: warm cream paper, hand-written fonts, slightly-tilted polaroids, washi tape, date stamps. Casual and personal, never "corporate app".

Non-goals for v1: multi-user accounts, comments, free-canvas positioning, real-time collab.

---

## 2. Tech stack

- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **React 19**, TypeScript (strict)
- **Prisma** ORM + **PostgreSQL** (Homebrew local on the Mac mini)
- **Tailwind CSS** for styling
- **sharp** for image resize/compression
- **jose** for signing the editor session JWT; **bcryptjs** for the password hash
- **framer-motion** for page transitions (start simple; 3D flip later)
- Fonts via `next/font` + Google Fonts: **Caveat** and **Kalam** (hand-written), plus one clean sans for UI chrome.
- Deploy: **PM2** + **Tailscale Funnel** on **Mac mini M4** (16GB). No cloud object storage — files on local disk.

---

## 3. Domain model (Prisma)

```prisma
// schema.prisma

model Book {
  id               String   @id @default(cuid())
  slug             String   @unique            // public URL segment, e.g. "our-story"
  title            String
  subtitle         String?
  theme            String   @default("cream")  // theme preset key (see §7)
  coverImageUrl    String?
  editPasswordHash String                       // bcrypt hash; plaintext known only to editors
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  pages            Page[]
}

model Page {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  order     Int                                 // 0-based position within the book
  layout    Layout   @default(SINGLE)
  bgStyle   String?                             // optional per-page paper override
  slots     Slot[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([bookId, order])
  @@index([bookId])
}

model Slot {
  id        String   @id @default(cuid())
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  key       String                              // slot id within the layout, e.g. "photo1", "text1"
  type      SlotType
  imageUrl  String?                             // PHOTO: processed image path
  thumbUrl  String?                             // PHOTO: small thumbnail path
  caption   String?                             // PHOTO: hand-written caption under the photo
  text      String?                             // TEXT: the note/letter/quote body
  rotation  Float    @default(0)                // decorative tilt in degrees (approx -6..6)
  tapeStyle String?                             // decorative tape/sticker preset key, nullable
  dateLabel String?                             // optional hand-written date stamp
  lat       Float?                              // PHOTO: decimal latitude (from EXIF GPS or set manually)
  lng       Float?                              // PHOTO: decimal longitude
  locationLabel String?                         // optional human label, e.g. "Bandung"
  locationSource String?                        // "exif" | "manual" — how lat/lng was set (null if unset)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([pageId, key])
  @@index([pageId])
}

enum Layout {
  COVER        // title + subtitle + optional hero photo
  SINGLE       // 1 photo + caption
  DUO          // 2 photos side by side + captions
  TRIO         // 3-photo collage
  PHOTO_TEXT   // 1 photo + a longer note beside it
  DUO_TEXT     // 2 photos + a story
  TEXT         // full-page note / letter
  QUOTE        // centered milestone quote
  CLOSING      // "to be continued" style ending
}

enum SlotType {
  PHOTO
  TEXT
}
```

**Slot contract per layout** — define this in `lib/layouts.ts` as the single source of truth. Both the editor (which slots to render as inputs) and the reader (how to place them) read from it:

```ts
// lib/layouts.ts
export type SlotSpec = { key: string; type: "PHOTO" | "TEXT"; label: string };

export const LAYOUTS: Record<Layout, { label: string; slots: SlotSpec[] }> = {
  COVER:      { label: "Sampul",        slots: [{ key: "photo1", type: "PHOTO", label: "Foto sampul" }, { key: "text1", type: "TEXT", label: "Judul / kutipan" }] },
  SINGLE:     { label: "Satu foto",     slots: [{ key: "photo1", type: "PHOTO", label: "Foto" }] },
  DUO:        { label: "Dua foto",      slots: [{ key: "photo1", type: "PHOTO", label: "Foto kiri" }, { key: "photo2", type: "PHOTO", label: "Foto kanan" }] },
  TRIO:       { label: "Kolase tiga",   slots: [{ key: "photo1", type: "PHOTO", label: "Foto 1" }, { key: "photo2", type: "PHOTO", label: "Foto 2" }, { key: "photo3", type: "PHOTO", label: "Foto 3" }] },
  PHOTO_TEXT: { label: "Foto + cerita", slots: [{ key: "photo1", type: "PHOTO", label: "Foto" }, { key: "text1", type: "TEXT", label: "Cerita" }] },
  DUO_TEXT:   { label: "Dua foto + cerita", slots: [{ key: "photo1", type: "PHOTO", label: "Foto kiri" }, { key: "photo2", type: "PHOTO", label: "Foto kanan" }, { key: "text1", type: "TEXT", label: "Cerita" }] },
  TEXT:       { label: "Surat",         slots: [{ key: "text1", type: "TEXT", label: "Isi surat" }] },
  QUOTE:      { label: "Kutipan",       slots: [{ key: "text1", type: "TEXT", label: "Kutipan" }] },
  CLOSING:    { label: "Penutup",       slots: [{ key: "text1", type: "TEXT", label: "Kata penutup" }] },
};
```

Guardrail: when the editor switches a page's layout, keep slot data whose `key` still exists in the new layout; drop the rest only after a confirm dialog.

---

## 4. Access & auth model

Deliberately lightweight — no user table, no OAuth.

- Each Book stores `editPasswordHash` (bcrypt). Plaintext is set at seed time / via an admin script, and shared privately between the couple.
- **Unlock flow:** `/book/[slug]/unlock` → user submits password → `POST /api/session` verifies against `editPasswordHash` → on success, set an **httpOnly, Secure, SameSite=Lax** cookie `ab_session` containing a `jose`-signed JWT `{ bookId, role: "editor", exp }` (~30 days).
- **Guard:** `lib/auth.ts` exports `requireEditor(bookId)` — reads and verifies the cookie, throws/redirects if invalid or `bookId` mismatch. Every mutating Server Action and the upload route calls it **first**, before touching the DB or disk.
- Public read routes never check auth.
- Add a signed-in "Selesai edit" button that clears the cookie.

```ts
// env
SESSION_SECRET=        // long random string for jose HS256
```

Rate-limit `POST /api/session` (e.g. simple in-memory token bucket per IP, 5 tries / 5 min) to slow brute force. Never reveal whether the slug exists on a wrong password.

---

## 5. Routes

**Pages (App Router)**
- `/` — landing. For v1 with a single book, redirect to `/book/[DEFAULT_SLUG]`.
- `/book/[slug]` — public reader. Fetches Book + Pages + Slots (ordered), renders the flip experience. Fully static-friendly / cacheable.
- `/book/[slug]/unlock` — password form.
- `/book/[slug]/edit` — editor shell (guarded by `requireEditor`; redirect to `/unlock` if not authorized).
- `/book/[slug]/map` — **memory map** (see §7.5). Public, read-only. Renders a pin per geotagged photo; ignores photos without coordinates.

**Route Handlers**
- `POST /api/session` — verify password, set cookie.
- `DELETE /api/session` — clear cookie.
- `POST /api/upload` — multipart image upload (editor-only). Returns `{ imageUrl, thumbUrl }`.
- `GET /api/media/[...path]` — streams a stored image from `UPLOAD_DIR` with long-lived cache headers. (Files live outside `/public`, so serve them through here.)

**Server Actions** (mutations, all call `requireEditor` first)
- `createPage(bookId, layout)`, `deletePage(pageId)`, `reorderPages(bookId, orderedIds[])`
- `setPageLayout(pageId, layout)`
- `upsertSlot(pageId, key, data)` — write caption/text/imageUrl/rotation/tape/date for a slot
- `updateBookMeta(bookId, { title, subtitle, theme, coverImageUrl })`

---

## 6. Image upload pipeline

In `POST /api/upload`:
1. `requireEditor` — reject anonymous.
2. Validate: mime in `image/jpeg|png|webp|heic`, size ≤ ~12MB pre-process. Reject otherwise.
3. **Extract geotag first (before re-encoding strips it).** Read EXIF GPS with `exifr` (`import exifr from "exifr"`): `const { latitude, longitude } = await exifr.gps(buffer) ?? {}`. `exifr` returns decimal degrees directly. If absent or malformed, treat as no geotag (`lat/lng = null`) — never fail the upload over a missing tag. Return `{ lat, lng }` alongside the image paths so the caller can persist them onto the slot.
4. Process with **sharp**:
   - Main: `rotate()` (bake in EXIF orientation) → resize to max **1600px** on the long edge (no upscale) → **webp** quality ~82.
   - Thumb: resize to **400px** long edge → webp quality ~70.
5. Write both to `UPLOAD_DIR` (env, a **persistent** path outside `.next`, e.g. `~/adventure-book/uploads`). Filenames = `${cuid}.webp` / `${cuid}.thumb.webp`.
6. **Strip metadata** (sharp drops it by default when re-encoding — never call `.withMetadata()`). The served file carries no GPS/EXIF; the coordinates now live only in the DB, where *you* control them. This is the whole point: the map works, but the public file leaks nothing.
7. Return the public paths (served via `/api/media/...`) plus `{ lat, lng }`.

Never trust the original filename. Never store absolute disk paths in the DB — store the media route path (e.g. `/api/media/<cuid>.webp`). The `upsertSlot` action writes `lat`/`lng` (and optional `locationLabel`) when the upload returns them.

---

## 7. Design direction

The scrapbook feel is the product. Details that matter:

- **Paper:** warm cream base (`#efe6d3`-ish), subtle center gutter shadow on the two-page spread. Theme presets keyed by `Book.theme`: `cream`, `dusk` (muted lavender), `kraft` (brown paper). Keep to 2–3 for v1.
- **Fonts:** Caveat / Kalam for captions, notes, and date stamps; a clean sans (Inter or similar) only for UI chrome (buttons, editor controls).
- **Photos:** render as polaroids — white frame, drop shadow, small `rotation` tilt from the slot, optional washi-tape corner via `tapeStyle`. Captions in Caveat under the frame.
- **Motion:** reader page transition = fade + slight horizontal slide (framer-motion), ~350ms. Respect `prefers-reduced-motion` (cut to instant). Save the 3D page-flip for Phase 5.
- **Responsive:** mobile-first. On narrow screens, collapse the two-page spread into a single stacked page per view; keep swipe left/right to navigate.
- **A11y:** every photo slot needs meaningful `alt` (fall back to caption or "foto kenangan"). Keyboard nav (←/→) for pages. Focus-visible states on editor controls.

Reference the couple's real copy tone: casual, warm, first-person, emoji sparingly. Don't over-design the chrome — the page content should feel handmade, the editor UI should feel quiet and out of the way.

---

## 7.5 Memory map (`/book/[slug]/map`)

A map showing where each geotagged photo was taken. Public, read-only. Ties the whole book together spatially.

**Stack:** `leaflet` + `react-leaflet`. Tiles: **Stamen Watercolor via Stadia Maps** — a hand-painted, paper-textured raster style that matches the scrapbook aesthetic. Set `maxZoom: 16` (the watercolor set thins out above 16 and shows gaps). Keep the required attribution visible: © Stadia Maps, © Stamen Design, © OpenStreetMap.

```
Tile URL: https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg
```

**Data:** query all PHOTO slots in the book where `lat` and `lng` are non-null, selecting `lat, lng, thumbUrl, caption, locationLabel` and the parent `page.order` + `book.slug`. Slots without coordinates are excluded here — that *is* the "ignore photos without geotag" handler; no marker is ever created for them.

**Markers:** custom `L.divIcon` styled as a mini polaroid — the photo's `thumbUrl` in a small white frame with a slight tilt, matching the reader's polaroid look. Not the default Leaflet pin.

**Behaviour:**
- **Auto-fit on load.** `map.fitBounds(bounds, { padding: [48, 48] })` over all markers. Handle the edge cases explicitly:
  - **1 marker** → `fitBounds` over-zooms; instead `setView([lat, lng], 13)`.
  - **0 markers** → don't render an empty floating map; show an empty state ("Belum ada foto dengan lokasi 📍") with a link back to the book.
- **Hover** a marker → popup/tooltip with a larger thumbnail + caption (`bindTooltip` or a controlled popup). On touch devices, tap shows the preview.
- **Click** a marker → navigate to the reader at that photo's page, e.g. `router.push(withBase(`/book/${slug}?page=${page.order}`))`. The reader reads `?page=` and opens directly to that spread.
- **Many/clustered pins** → optional `leaflet.markercluster` so dense areas (e.g. lots of photos in one city) stay legible. Nice-to-have, not required for v1.
- Respect `prefers-reduced-motion`: skip `flyTo` animations, jump directly.
- Add a small "🗺️ Peta" entry point from the reader chrome.

**Keys/attribution:** tiles load client-side. Stadia authorizes the `localhost` referer without a key but returns **401 from any other host** — so for the public Funnel host, register a free Stadia account and use a **domain-restricted** API key — safe to expose as `NEXT_PUBLIC_STADIA_API_KEY` since it's locked to your hostname. **Fallback:** when the key is empty, `lib/mapTiles.ts` serves standard OSM tiles (`tile.openstreetmap.org`) instead so the map never breaks — plainer look, same behaviour. Keep attribution controls enabled (it's a licence requirement, not optional chrome).

**Manual location (editor).** Not every photo has a geotag — screenshots, images sent over WhatsApp (strips EXIF), or shots taken with location services off arrive with no coordinates. So each PHOTO slot in the editor gets a **"📍 Lokasi"** control:
- If the slot already has `lat`/`lng` (from EXIF or a previous manual set), show it on a small map with the pin, plus a "Ubah" and "Hapus lokasi" action.
- If it has none, show "Set lokasi manual" → opens a small Leaflet picker (same watercolor tiles). Click to drop a pin, drag to fine-tune, "Simpan" writes `lat`/`lng` with `locationSource = "manual"`.
- "Hapus lokasi" clears `lat`/`lng`/`locationSource` back to null (removes the pin from the map).
- Precedence: EXIF is written at upload; a manual set overwrites it and flips `locationSource` to `"manual"`. Never silently overwrite a manual pin with EXIF on re-upload — if a slot is already `manual`, keep it unless the editor explicitly clears it.
- Optional (nice-to-have): after a manual set, reverse-geocode via OSM **Nominatim** to prefill `locationLabel` (respect its usage policy — 1 req/s, include a proper User-Agent; debounce and cache). Skip for v1 if unsure; a manual text field for `locationLabel` is enough.

This is also the backfill path for photos uploaded before geotag capture existed: open the slot, drop a pin, done.

**Server action:** extend `upsertSlot` (or add `setSlotLocation(slotId, { lat, lng, source, label })` / `clearSlotLocation(slotId)`), guarded by `requireEditor`. Validate `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]` with zod; reject anything else.

---

## 8. Build phases

Ship in order; each phase should be runnable.

- **Phase 0 — Scaffold.** Next.js 15 + TS + Tailwind + Prisma. `schema.prisma` from §3, migrate, and a `prisma/seed.ts` that creates one demo Book (with a bcrypt password from `SEED_EDIT_PASSWORD`) and 3–4 sample pages across different layouts.
- **Phase 1 — Reader.** `/book/[slug]` renders the ordered pages with polaroid/paper styling and fade-slide navigation. No editing yet. Mobile stacked view + swipe.
- **Phase 2 — Auth + editor shell.** Unlock flow, `ab_session` cookie, `requireEditor`. `/book/[slug]/edit`: list pages, add page (pick layout from `LAYOUTS`), reorder (drag handle), delete (confirm), edit book title/subtitle/theme.
- **Phase 3 — Slots + upload.** Per-slot editing driven by `LAYOUTS`: text inputs for TEXT slots, image upload + caption + rotation + date-stamp + tape picker for PHOTO slots. Wire `/api/upload` + sharp. **Extract EXIF GPS with `exifr` at upload and persist `lat`/`lng` onto the slot (§6)** so the map has data later. Live preview mirroring the reader render.
- **Phase 4 — Polish.** Theme presets, decorative tape/sticker set, empty states, loading/skeletons, error toasts, cover page editing.
- **Phase 5 — Memory map + manual location.** `/book/[slug]/map` per §7.5: Leaflet + react-leaflet, Stamen Watercolor tiles, polaroid `divIcon` markers, auto-fit with 1/0-marker edge cases, hover-preview, click-to-page. Add the editor's "📍 Lokasi" picker (set / adjust / clear a pin per photo slot) — also the backfill path for older photos with no EXIF. Requires Phase 3. Reader entry point + `?page=` deep-link.
- **Phase 6 — Nice-to-haves.** 3D page-flip (`react-pageflip` / StPageFlip), marker clustering, optional background-music toggle, timeline/table-of-contents view, export-to-PDF, share sheet.

Do not start a later phase until the earlier one runs end-to-end.

---

## 9. Project structure

```
app/
  page.tsx                      // landing / redirect
  book/[slug]/
    page.tsx                    // reader
    unlock/page.tsx             // password form
    edit/page.tsx               // editor shell (guarded)
  api/
    session/route.ts            // POST/DELETE
    upload/route.ts             // POST
    media/[...path]/route.ts    // GET
components/
  reader/                       // Page renderers per layout, PolaroidFrame, PaperSpread, PageNav
  editor/                       // PageList, LayoutPicker, SlotEditor, ImageUploader, MetaEditor
  ui/                           // buttons, inputs, dialogs
lib/
  db.ts                         // Prisma client singleton
  auth.ts                       // requireEditor, session sign/verify
  layouts.ts                    // LAYOUTS (source of truth)
  images.ts                     // sharp helpers
  themes.ts                     // theme preset tokens
actions/                        // server actions (page/slot/book mutations)
prisma/
  schema.prisma
  seed.ts
```

Layout rendering: one small component per `Layout` value (e.g. `LayoutSingle`, `LayoutDuo`), selected by a `renderLayout(page)` switch. The **same** layout components render in both reader and editor preview — editor just overlays edit affordances. Keep a single rendering path so preview always matches reality.

---

## 10. Conventions & guardrails

- TypeScript strict; no `any`. Validate all Server Action / route inputs with **zod**.
- Prisma client as a singleton in `lib/db.ts` (avoid dev hot-reload connection storms).
- Every mutation and the upload route calls `requireEditor` **before** any side effect.
- Sanitize/escape user text on render; captions and notes are plain text (no HTML injection). If you later allow light markdown, sanitize server-side.
- Enforce upload size/type limits server-side, not just client-side.
- Store media as route paths, never absolute disk paths. `UPLOAD_DIR` must be a persistent location, backed up separately from the repo.
- Ordering: keep `Page.order` contiguous; `reorderPages` rewrites the full ordered list in one transaction.
- Respect `prefers-reduced-motion`. Provide `alt` text everywhere.
- Don't hardcode the slug/password — read from env / DB. Keep secrets out of the repo.
- Commit per phase; keep migrations in version control.

---

## 11. Environment variables

```
PORT=3002                  # app listens here (dev + prod)
BASE_PATH=/adventure       # served under a subpath on the shared Funnel hostname
DATABASE_URL=postgresql://.../adventure_book
SESSION_SECRET=            # jose HS256 signing secret (long random)
UPLOAD_DIR=                # persistent path, e.g. /Users/<you>/adventure-book/uploads
DEFAULT_SLUG=our-story     # v1 single-book redirect target
SEED_EDIT_PASSWORD=        # plaintext used only by prisma/seed.ts to create the bcrypt hash
NEXT_PUBLIC_STADIA_API_KEY= # optional; domain-restricted Stadia key for watercolor tiles on the public host
```

---

## 12. Deployment (Mac mini M4)

This app is **not** served at the domain root. The Mac mini runs several apps behind a single Tailscale Funnel hostname (`jafars-mac-mini.tail9e540f.ts.net`), differentiated by path. This one lives under **`/adventure`**.

- App runs on **port 3002** (set `PORT=3002`). In `package.json`, make the scripts explicit: `"dev": "next dev -p 3002"` and `"start": "next start -p 3002"`.
- **Base path.** Set `basePath` in `next.config` so all routes and assets resolve under `/adventure`:
  ```js
  // next.config.js
  const nextConfig = { basePath: process.env.BASE_PATH || "/adventure" };
  ```
  `next/link`, `next/image`, and the router handle `basePath` automatically. **Manual `fetch` calls do not** — any hand-written path (e.g. calling `/api/upload`, `/api/session`, or building an `imageUrl`) must be prefixed. Define one helper and use it everywhere:
  ```ts
  // lib/basePath.ts
  export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/adventure";
  export const withBase = (p: string) => `${BASE_PATH}${p}`;
  ```
  Store media as `withBase("/api/media/<cuid>.webp")` so paths stay correct under the subpath.
- **Cookie scope (important).** Because every app on the Mac mini shares the same hostname, cookies leak across apps unless scoped. Set the `ab_session` cookie with **`Path=/adventure`** so it isn't sent to (or clobbered by) Signum or any other app on the same host. Use a book-specific cookie name too (`ab_session`, not `session`).
- PostgreSQL via Homebrew; run `prisma migrate deploy` on release.
- `next build` then run under **PM2**: `PORT=3002 pm2 start npm --name adventure-book -- start`, then `pm2 save`.
- Confirm nothing else already occupies 3002 — `lsof -i :3002` should be empty before first start.
- Expose via **Tailscale Funnel** under the `/adventure` path (background mode). Gotcha: `--set-path` **strips** the prefix before proxying, but Next expects it because of `basePath` — so the proxy target must include `/adventure` too:
  ```bash
  tailscale funnel --bg --set-path=/adventure http://127.0.0.1:3002/adventure
  tailscale funnel status        # verify: /adventure proxy http://127.0.0.1:3002/adventure
  ```
  Public URL: `https://jafars-mac-mini.tail9e540f.ts.net/adventure`. Funnel always serves HTTPS, so keep the session cookie `Secure`.
- `UPLOAD_DIR` lives on local disk outside the build dir; include it in your backup routine (photos are irreplaceable).
- Set `NODE_ENV=production`; confirm `next.config` allows serving images through the media route (they're not in `/public`).