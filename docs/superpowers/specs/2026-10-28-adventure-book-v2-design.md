# Adventure Book v2 — design

Status: approved direction (brainstorm 2026-10-28). Sections 3–6 of the original walkthrough were
delegated to the implementer ("lanjut saja sampai jadi dan audit sendiri"); every call made on the
user's behalf is listed in §2 so it can be revisited.

This document supersedes the parts of `CLAUDE.md` that describe themes (§7), layouts (§3 slot
contract), the reader motion model (§7 Motion), and the editor (Phase 2–4). `CLAUDE.md` is rewritten
to match in Phase 6.

---

## 1. Summary

Adventure Book becomes a **shelf of books**. Each book is **one continuous, horizontally scrolling
paper diorama** that fills the screen. Every page of the old book becomes a **stop** (station) along a
dotted path; the paper landscape (sky, hills, city, sea, night) flows from stop to stop and changes
with each stop's **theme**. Themes are **palette + asset kit** (Stroberi, Senja, Matcha, Laut,
Lavender). Photos sit in **fixed template frames** (3:4, 4:3, 1:1, 9:16, 16:9) and are cropped by a
per-photo focal point, so sizes are always consistent. The **cover** (die-cut window board), the
**start sign** (bookplate) and the **end** ("bersambung" + wishlist signposts + back cover) are book
parts, not templates.

Editing happens **in the book itself** (same renderer, overlays only), with a single icon dock, no
emoji, minimal text, autosave and undo. Many photos can be added at once; date and location come from
the files.

## 2. Decision log

Decided with the user (brainstorm):

| # | Decision |
|---|---|
| U1 | Art style: layered paper-cut "paper diorama" (references: `references/ref1-adv.jpg`, `ref2-adv.jpg`). |
| U2 | Five themes, each = 4 analogous shades + 1 complementary accent: Laut, Senja, Stroberi, Matcha, Lavender. |
| U3 | A theme carries its own asset kit (Stroberi = romantic, Senja = jalan-jalan, Matcha = kafe & makan, Laut = liburan, Lavender = malam). |
| U4 | Theme chosen **per page**; the book has a default theme (cover, chrome, new pages). |
| U5 | Template decides the frame shape; photos are cropped with an adjustable focal point. |
| U6 | Decorations are automatic per template + theme, with a "shuffle decorations" (dice) action. |
| U7 | Cover and closing are book parts with their own style, not templates. Cover = felt board with die-cut photo window; endpaper bookplate; closing pocket with wishlist; back cover. |
| U8 | Multiple books on a shelf. |
| U9 | Navigation = one continuous canvas you keep swiping (prototype C), full-screen, cover view on phones with side padding. |
| U10 | Editor edits in place; preview must be pixel-identical to the reader; icons instead of text; no emoji in UI chrome (custom icons only); simple. |
| U11 | Editing happens on both phone and laptop, equally. |
| U12 | Build in parallel to the live app, then switch over. |

Decided by the implementer (delegated):

| # | Decision | Why |
|---|---|---|
| I1 | One renderer (`components/world/*`) for reader, editor, page tiles, and the dev gallery. Editing adds overlays only. | U10 "persis" is guaranteed by construction, not by discipline. |
| I2 | 12 templates (§6). `TRIO_TEXT` is reinterpreted as the photobooth strip; `TEXT` as the letter. | Keeps the legacy enum mappable 1:1 per family. |
| I3 | v2 stores its template in a new `Page.template` column and keeps `Page.layout` in sync with the legacy family, so the old app keeps rendering during the parallel period. | U12; additive-only migrations. |
| I4 | Feature flag `ADVENTURE_V2=1` (server env, read per request) makes v2 the default; `?v=2` previews v2 while the flag is off; `?v=1` forces the old reader while it still exists. | Instant rollback = unset env + `pm2 restart`, no rebuild. |
| I5 | Development happens in a git worktree on branch `v2`, against a **copy** of the database (`adventure_book_v2dev`) and a **copy** of `uploads/`, on port 3012. | The live app and real photos are never touched by development or tests. |
| I6 | Autosave + client-side undo stack; deletes are undone by restoring a snapshot. No `confirm()` dialogs anywhere. | U10 simplicity; undo is safer than dialogs. |
| I7 | Date stamp shows `dateLabel` if set, else the photo's `takenAt` (from EXIF), formatted `15 Jul 2026`; `showDate` hides it. | Dates appear automatically (today only 11 of 48 media have one). |
| I8 | Videos also read creation date + GPS (QuickTime ISO 6709) with `ffprobe` before metadata is stripped. | Videos join the map and the date grouping. |
| I9 | Month signposts are generated automatically when the month changes between consecutive stops. | Gives the long canvas a timeline without any manual work. |
| I10 | Irreversible cleanup (dropping legacy columns, deleting the old COVER/CLOSING pages) is **not** executed until the user confirms after returning. Everything else in Phase 6 (switch, redirects, removing old UI code) is done. | Destructive data changes need explicit approval; leaving the columns is harmless. |
| I11 | Tests: Vitest for pure logic, Playwright (system Chrome, no browser download) for E2E and visual snapshots against the dev server + dev DB. | The repo has no tests today; the redesign is too large to verify by eye only. |

## 3. Visual language

**Material.** Everything is a piece of paper or felt: cut shapes stacked in layers. Light always
comes from the upper left: floating pieces cast `drop-shadow(1.5–2u, 3–4u, blur 2–3u, rgba(30,16,20,.30))`;
stacked landscape bands cast a soft shadow *upward* onto the layer behind (`dy -2u, blur 2.6–3u`).
A paper grain (fractal-noise tile, multiply, ~35%) covers paper and scenery but **not** photos.
Covers use a coarser felt texture.

**Typography.** Caveat 700 for captions, titles, signposts, stamps. Kalam 400 for stories and
letters. Inter for UI chrome (only where text is unavoidable). Minimum UI text size 12px; UI text
contrast ≥ 4.5:1.

**Iconography.** One custom icon set (`components/ui/icons.tsx`), 24×24 grid, 2px round strokes,
`currentColor`. No emoji anywhere in UI chrome or system copy (user-written captions may contain
emoji). Every icon-only control has `aria-label` and a `title` tooltip (hover / long-press).

Icons: `check, undo, grid, book, plus, photos, swap, focus, calendar, pin, trash, layout, dice, map,
spark (wishlist), share, music, music-off, pencil, zoom-in, drag, close, chevron-left, chevron-right,
play, arrow-right, shelf, warning, spinner, cloud-check, film, text`.

**Copy.** Indonesian, casual, as short as possible. Prefer an icon; use text only for content
(titles, captions, dates, stats) or when an icon would be ambiguous (password field placeholder).

## 4. Themes

Tokens per theme (CSS custom properties on each region/station; also exported from
`lib/v2/themes.ts`):

| key | label | paper | c1 | c2 | c3 | c4 | accent | cloud | sky | deep | moment kit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `stroberi` | Stroberi | #fbefe9 | #f6c8cf | #ee9db0 | #d6688a | #a5436a | #7fae9a | #fffaf8 | #f8d9df | #8c3659 | romantis |
| `senja` | Senja | #f7ecd8 | #f1d095 | #e3a24f | #c96d3b | #93452b | #7f9a54 | #fffaf1 | #f5dfb8 | #76361f | jalan-jalan |
| `matcha` | Matcha | #f3efdc | #cfd8ae | #9cb47d | #5f8558 | #33553f | #e5876b | #fffcf0 | #e4ead2 | #26402f | kafe & makan |
| `laut` | Laut | #f1e6cf | #b4c8d3 | #7c9cbc | #3f6b98 | #1f3d62 | #e2742c | #f8f0de | #d3e0e7 | #172f4c | liburan |
| `lavender` | Lavender | #f2edf5 | #cec3e5 | #a193cd | #6c60a6 | #3b356e | #f0c159 | #fdfbff | #3f3974 (night) | #2b2752 | malam |

Legacy book themes map `cream → stroberi`, `dusk → lavender`, `kraft → senja`.

Each theme kit (`components/world/themes/<key>.tsx`) provides:

- `sky(x0, x1)`: far layer pieces (sun / big heart / moon + stars, clouds) — may use y < 0 for tall screens.
- `mid(x0, x1)`: mid layer silhouettes (Stroberi lace hills; Senja mountains + small city; Matcha
  rounded bushes; Laut snow-capped mountain + waves; Lavender dark hills + lantern lights).
- `ground(x0, x1)`: three bands (c2 / c3 / c4), the dotted path at y≈642 drawn by the world.
- `front(x0, x1)`: deep band + small ground stickers (strawberries; palms; potted plants; shells;
  little stars).
- `stickers`: pools by anchor kind — `sky`, `side`, `ground` — 10–12 stickers per theme in total.
  Stroberi: heart, cloud, envelope, rose, strawberry, ribbon, cherry, love-letter. Senja: ticket,
  hot-air balloon, crescent, palm, compass, paper plane, cactus. Matcha: cup, noodle bowl, potted
  plant, leaf, donut, croissant, chopsticks. Laut: shell, starfish, paper boat, gull, fish, sun,
  lighthouse. Lavender: moon, star, lantern, popcorn, film ticket, cloud (translucent), firefly.
- `mount`: how polaroids are attached — Stroberi bow, Senja kraft tape, Matcha two corner tapes,
  Laut striped tape, Lavender dotted tape.
- `stamp`: date stamp colours (c3 fill, paper text, dashed inner ring).

All kit pieces are hand-authored SVG with fills from the theme tokens; textures are tiled data-URI
images, never live `feTurbulence` per element.

## 5. Book structure

```
Shelf (rak)  ──  Book (vol.)  ──  World:  [start] [stop] (gap) [stop] (gap) [signpost?] ... [end]
```

- **Cover (closed book).** Overlay shown on first entry per session (sessionStorage per slug) and
  skipped for deep links. Felt board in the book theme, stitched spine, corner protectors, ribbon
  bookmark, title label (Caveat), subtitle (`Adventure Book · vol. N`), arch die-cut window showing
  the cover photo (with `coverFocusX/Y`), cover note label. On phones the book is ~76% of the width
  (side padding). Tap → the book scales up and fades (700ms; instant with reduced motion).
- **Start segment (420u).** Signboard on two posts: title, `vol. N`, `dimulai <earliest date>`, and
  an animated arrow icon. Uses the first stop's theme.
- **Stops.** One per page, in `Page.order`, template-defined width (§6), 90u gap between stops.
- **Month signposts (180u).** Inserted before a stop whose month differs from the previous dated stop
  (Indonesian month name + year, e.g. `Agustus 2026`). Undated stops inherit the previous month.
- **Theme seams.** When adjacent stops differ in theme, the boundary sits at the centre of the gap (or
  the signpost) and is covered by a bush cluster (previous `c4` + next `c3/c4`). Sky colour crossfades
  over ±260u.
- **End segment (~760u).** "~ bersambung ~" sign with automatic stats (`N halaman · M kenangan`,
  date range) and the closing text; up to three undone wishlist items as small signposts linking to
  the wishlist; a "close book" icon that shows the **back cover** overlay (board, small landscape,
  round "bersambung · vol. N" stamp).

## 6. Templates

Station-local coordinates in design units (`u`); every station is 720u tall. Polaroid card = photo
window + 12u padding (sides, top) + 46u caption band. Film frame = window + sprocket margins (28u on
the sprocket sides, 14u on the others). Rotations are fixed by the template.

| key | label | width | slots (key: ratio, window w×h, card position x,y, rot) | legacy |
|---|---|---|---|---|
| `single-tall` | Satu foto tegak | 380 | photo1: 3:4, 276×368 @ (40,110), −1.5° | SINGLE |
| `single-wide` | Satu foto lebar | 500 | photo1: 4:3, 396×297 @ (40,150), 1.5° | SINGLE |
| `duo-side` | Dua foto berdampingan | 500 | photo1: 3:4, 186×248 @ (30,150), −2.5° · photo2: 3:4 @ (260,190), 2° | DUO |
| `duo-stack` | Dua foto bertumpuk | 460 | photo1: 4:3, 266×200 @ (30,50), −2° · photo2: 4:3 @ (140,300), 2.5° | DUO |
| `trio` | Tiga foto | 600 | photo1: 4:3, 276×207 @ (30,130), −2° · photo2: 1:1, 166 @ (350,80), 3° · photo3: 1:1 @ (370,320), −2.5° | TRIO |
| `photo-text` | Foto + cerita | 590 | photo1: 3:4, 226×301 @ (30,110), −2.5° · text1: lined note 250×240 @ (300,260), 2°, ≤7 lines | PHOTO_TEXT |
| `duo-text` | Dua foto + cerita | 480 | photo1: 1:1, 166 @ (30,70), −3° · photo2: 1:1 @ (250,90), 2.5° · text1: note 400×190 @ (40,340), −1°, ≤4 lines | DUO_TEXT |
| `strip-text` | Strip photobooth + cerita | 500 | photo1–3: 1:1, 146 each in one strip 170×516 @ (30,60), −2.5° · text1: note 240×280 @ (230,170), 2°, ≤7 lines | TRIO_TEXT |
| `video-tall` | Video tegak | 360 | video1: 9:16, 216×384, film 272×412 @ (40,80), −1.5° · caption label @ (76,506) | VIDEO |
| `video-wide` | Video lebar | 490 | video1: 16:9, 400×225, film 424×281 @ (30,170), 1.5° · caption label @ (130,466) | VIDEO |
| `letter` | Surat | 400 | text1: letter 330×450 @ (30,60), −2°, ≤10 lines, envelope pocket in front | TEXT |
| `quote` | Kutipan | 440 | text1: paper cloud 400×260 @ (20,190), Caveat 48u, ≤3 lines | QUOTE |

Each template also declares:

- **Decoration anchors**: 4–7 `{x, y, kind: sky|side|ground, size}` in free space. A seeded RNG
  (`hash(page.id) ^ decorSeed`) picks a sticker from the theme pool for each anchor, leaves ~30% empty,
  jitters rotation ±12° and scale 0.85–1.15. Same seed → same page, always.
- **Stamp anchor** (date) and **tag anchor** (location label) relative to photo1.
- **Glyph**: the 30×22 pictogram used in pickers (approved in the editor prototype).

Text never overflows: notes and letters clamp to their line limit at their fixed font size.

Captions are single-line, ellipsized at the card width. Photos use `object-fit: cover` with
`object-position: focusX% focusY%`.

### Legacy mapping (no user action needed)

`template` is derived when null: SINGLE → `single-tall` if photo1 is portrait (h > w) else
`single-wide`; DUO → `duo-stack` if both photos are landscape else `duo-side`; VIDEO → `video-tall` if
portrait else `video-wide`; TRIO → `trio`; PHOTO_TEXT → `photo-text`; DUO_TEXT → `duo-text`;
TRIO_TEXT → `strip-text`; TEXT → `letter`; QUOTE → `quote`; COVER/CLOSING → not a stop. Writing a
template also writes the matching legacy `layout`.

For the current book this yields 12 `single-tall`, 9 `duo-side`, 4 `duo-stack`, 2 `trio`,
2 `video-wide`, 1 `video-tall`, 1 `quote` (31 stops).

## 7. World renderer

**Scale.** `s = min(viewportHeight / 720, viewportWidth / 460)` px per u. The 720u core band is
placed with 60% of the spare height above (more sky) and 40% below; sky colour fills above,
the deepest ground colour fills below. Chrome floats over the world.

**Layout** (`lib/v2/world.ts`, pure): input = book + pages + wishlist summary; output = an ordered
list of segments `{kind: start|stop|gap|signpost|end, x, width, theme, pageId?, month?}` plus theme
regions, seams, total width, and per-stop centre x. Deterministic and unit-tested.

**Layers & parallax.** far (f=0.22), mid (0.55), ground (1), items (1), front (1.16). A layer with
factor f is `f·(W − vw) + vw` wide and is translated by `scrollLeft·(1−f)`; region boundaries map
into layer space with `x ↦ f·x + (1−f)·vw/2`. One rAF-throttled scroll handler writes transforms,
the sky colour, and the timeline knob. With `prefers-reduced-motion`, every factor is 1.

**Virtualisation.** Every layer is split into per-segment slices (with 60u overlap). Slices use
`content-visibility: auto` and are only mounted within ±1.5 viewport widths of the visible range in
their own layer space; images are `loading="lazy" decoding="async"`, and stops far away use
`thumbUrl`.

**Navigation.** Native horizontal scroll with momentum (no snap). Vertical wheel maps to horizontal
on desktop. ←/→ jump to the previous/next stop centre. Timeline strip (bottom): a dot per stop, short
month labels where a month starts, a draggable knob for scrubbing. Deep links: `?p=<pageId>` (new) and
`?page=<order>` (legacy, used by old map links) scroll to that stop and skip the cover.

**Chrome (reader).** Top-left: shelf (Phase 5). Top-right: map, wishlist, share. Bottom strip: music
toggle · timeline · pencil (edit). Icons only.

**Video stops.** Poster + play icon; tap plays inline (`playsInline`, `preload="none"`); pause when
scrolled out of view (IntersectionObserver).

**Accessibility.** The world is a labelled scroll region; each stop is a `section` labelled
`Halaman N`; photo `alt` = caption or `foto kenangan`; all controls are focusable with visible focus.

## 8. Editor

Entry: pencil → if no editor session, an unlock sheet (password field + check). Route
`/book/[slug]/edit` renders the world with `mode="edit"`.

- **Top bar:** done (check), undo, save status (cloud-check / spinner / warning — icon only),
  all pages (grid), book settings (book).
- **Selection:** tap a stop's empty space → stop selected; tap a photo → photo selected; tap a caption
  or note → inline editor exactly over the text (same font, size, colour, width). Esc / tap outside
  deselects.
- **Dock (one bar, bottom centre), by selection:**
  - stop: template · theme · shuffle decorations · delete stop
  - photo/video: replace · focus · date · location · delete media
  - focus mode: drag the photo inside its frame; dock shows only check.
- **Sheets:** template (12 glyphs, current highlighted), theme ("ikut buku" ring + 5 colour dots),
  date (native date input + hide-date toggle icon), location (Leaflet picker + label field),
  add (photos / empty stop by template glyph).
- **Insert:** a ＋ on the path in every gap (and after the last stop) opens the add sheet for that
  position.
- **All pages:** grid of tiles; each tile renders the real stop (same components) inside a
  500u-wide window; long-press + drag to reorder (`@dnd-kit/sortable`), tap to jump.
- **Book settings sheet:** title, `vol.`, cover photo (+ focus), cover note, closing text, book theme.
  These are text fields because they are content.
- **Autosave:** text edits debounce 500ms; structural edits save immediately; optimistic UI; failures
  show the warning icon and retry with backoff, keeping local state.
- **Undo:** stack of inverse operations for the session: field edits, template/theme/seed changes,
  reorder, insert (→ delete), delete (→ restore snapshot at the same position).
- **Template switch:** keeps slots whose key exists in the new template; others stay in the database
  (not rendered) so switching back restores them. No dialogs.
- Removed controls: tilt slider, tape picker, frame-format picker, explicit save button.

## 9. Uploads and "add many photos"

`POST /api/upload` additionally returns `width`, `height` (processed media / poster), and `takenAt`
(ISO) — from EXIF `DateTimeOriginal`/`CreateDate` for photos, `ffprobe` `creation_time` for videos —
plus `lat/lng` for videos from the QuickTime ISO 6709 location tag. Metadata is still stripped from
the stored files.

Add-many flow: pick N files → upload with progress (2 in parallel) → group:

1. Sort by `takenAt`; files without a date keep pick order in a final "tanpa tanggal" group.
2. Group by calendar day in `Asia/Jakarta`.
3. Per day: each video is its own stop (`video-tall` if portrait else `video-wide`). Photos are
   chunked into stops of ≤3; a remainder of 1 after a 3 becomes 2+2.
4. Per chunk: 1 → `single-tall`/`single-wide` by shape; 2 → `duo-stack` if both landscape else
   `duo-side`; 3 → `trio` with the most landscape photo as photo1.

Review sheet: per group date (content text), thumbnails (tap to exclude), template glyph (tap to
change), theme dot. Confirm ("check" + count) creates all stops at the insert position in one
transaction, with `takenAt`, dimensions, and location on the slots.

## 10. Shelf, auth, map, wishlist (Phase 5)

- `Shelf` holds the edit password hash and the wishlist. The existing book is attached to a new shelf
  whose hash is copied from the book, so the password does not change.
- `/` shows the shelf: a paper shelf diorama with books face-out (cover art per book theme), a ＋ for
  editors (creates a book: title + theme; next `vol.`; slug from title, unique).
- Unlock verifies the shelf password once; the session token carries `shelfId`. `requireEditor(bookId)`
  accepts a session whose `shelfId` owns the book (and legacy `bookId` sessions during the parallel
  period).
- `/map` shows geotagged media from every book (photo and video); marker click opens
  `/book/<slug>?p=<pageId>`. Per-book colour filter when there is more than one book.
- `/wishlist` is shelf-level, paper-styled, icon controls; editing is inline when unlocked. The end
  segment of every book shows the first three undone items.
- Old per-book map/wishlist URLs redirect to the shelf-level pages.

## 11. Data model changes

All migrations in Phases 1–5 are **additive**.

```prisma
model Shelf {
  id               String         @id @default(cuid())
  title            String
  editPasswordHash String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  books            Book[]
  wishlist         WishlistItem[]
}

// Book      + shelfId String? (FK, SetNull) · shelfOrder Int @default(0) · volume Int?
//           + coverText String? · coverFocusX Float @default(0.5) · coverFocusY Float @default(0.5)
//           + closingText String?          (theme values become the v2 keys)
// Page      + template String? · theme String? · decorSeed Int @default(0)
// Slot      + focusX Float @default(0.5) · focusY Float @default(0.5) · width Int? · height Int?
//           + takenAt DateTime? · showDate Boolean @default(true)
// Wishlist  + shelfId String? (FK, Cascade); v2 also writes bookId = the shelf's first book
```

Backfill scripts (`scripts/v2/*.ts`, idempotent, `--dry-run` prints the plan):

1. `media-dims` — width/height for every slot from the stored file (sharp metadata).
2. `taken-at` — parse Indonesian `dateLabel` ("12 Agustus 2026", "17 Agu 2026") into `takenAt`.
3. `templates` — set `Page.template` with the legacy mapping (§6).
4. `book-parts` — copy the COVER page photo/text into `coverImageUrl`/`coverText`, the CLOSING text
   into `closingText`; map the book theme (`cream → stroberi`).
5. `shelf` (Phase 5) — create the shelf, attach books, set wishlist `shelfId`.

Deferred until the user confirms (I10): drop `rotation`, `tapeStyle`, `aspect`, `bgStyle`,
`Book.editPasswordHash`, `WishlistItem.bookId`, the `COVER/CLOSING` enum values and pages.

## 12. Routes, environments, rollout

| Path | v2 |
|---|---|
| `/` | shelf (Phase 5; before that, redirect to the default book) |
| `/book/[slug]` | world reader (`?p=`, `?page=`) |
| `/book/[slug]/edit` | world editor |
| `/book/[slug]/unlock` | unlock page (fallback for the sheet) |
| `/map`, `/wishlist` | shelf-level (Phase 5); per-book paths redirect |
| `/dev/gallery` | every template × theme, development only (404 in production) |

`app/book/[slug]/page.tsx` and siblings pick v1 or v2 per request: v2 when `ADVENTURE_V2=1` or
`?v=2`; v1 when `?v=1` while v1 still exists.

**Development.** Worktree `../adventure-book-v2` on branch `v2`; `.env` points at database
`adventure_book_v2dev` (a `pg_dump` copy, refreshed by `scripts/v2/dev-db.sh`) and at its own
`uploads/` copy; `next dev -p 3012`. Nothing in development or tests can write to the live database
or the live `uploads/`.

**Release.** Merge `v2` into `main` → back up the database (`pg_dump`) and `uploads/` →
`prisma migrate deploy` → backfill scripts → `npm run build` → `pm2 restart adventure-book` → verify
with `?v=2` → set `ADVENTURE_V2=1` → restart → verify. **Rollback:** unset `ADVENTURE_V2`, restart
(the database stays compatible with v1).

## 13. Error handling

- Upload: per-file progress and retry in the add sheet; unsupported or broken files are marked with
  the warning icon and skipped; nothing is created until confirm.
- Autosave: queued with retry/backoff; the status icon shows warning until it succeeds; leaving the
  editor with unsaved changes waits for the queue (or warns with the icon state).
- Missing media file: the frame shows a paper placeholder with the photo icon.
- Empty book: the world shows the start sign, a "belum ada kenangan" signpost for readers, and the ＋
  for editors.
- Unknown template/theme value: fall back to the legacy mapping / the book theme.

## 14. Testing and verification

- **Vitest** (`lib/v2/**/*.test.ts`): template invariants (frames inside 0..width × 0..720, anchors
  do not overlap frames), legacy mapping, world layout (segments, seams, signposts, widths),
  Indonesian date parsing/formatting, bulk grouping and template suggestion, decoration seeding
  determinism, scale function.
- **Playwright** with the system Chrome channel against the dev server and dev DB:
  - visual snapshots of `/dev/gallery` (12 templates × 5 themes) at 390×844 and 1440×900;
  - reader smoke: cover → open → scroll → deep link `?p=` → map link;
  - editor smoke: unlock → edit caption (autosave) → undo → change template/theme → shuffle →
    reorder → delete + undo → add many photos;
  - **parity**: the same stop rendered in the reader and in the editor (overlays hidden) produces
    identical screenshots.
- `npm run lint`, `tsc --noEmit`, `next build` must pass at every phase boundary.

## 15. Phases and acceptance

| Phase | Done when |
|---|---|
| 1 Foundation | v2 tokens, icons, textures, theme kits, 12 templates render in `/dev/gallery`; additive migration applied to the dev DB; backfill scripts produce the expected mapping (§6 counts); unit tests pass. |
| 2 World reader | `/book/our-story?v=2` renders the whole book as one world on phone and desktop sizes; parallax, seams, signposts, cover, start, end, back cover, timeline, deep links, video, reduced motion all work; Playwright reader smoke passes. |
| 3 Editor | In-place editing as §8 on phone and desktop sizes; autosave, undo, reorder, template/theme/seed, focus, date, location, book settings; parity test passes; legacy `layout` kept in sync. |
| 4 Add many photos | Upload metadata extended; grouping + review + one-transaction create; E2E passes. |
| 5 Shelf | Shelf model + migration, shelf page, create book, shelf password, shelf-level map and wishlist with redirects. |
| 6 Switch | Merged, released, flag on, verified; v1 UI code and `react-pageflip` removed; `CLAUDE.md` rewritten for v2; deferred destructive cleanup documented for the user. |

## 16. Non-goals

Free-canvas positioning; manual per-sticker placement; real-time collaboration; offline mode; PDF
export; comments; user accounts; a 3D page-flip.
