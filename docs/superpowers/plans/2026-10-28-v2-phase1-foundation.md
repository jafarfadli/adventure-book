# Adventure Book v2 — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Everything later phases stand on: v2 data columns (additive), theme tokens + five paper-art kits, custom icons, the 12-template registry, a single `Station` renderer, the backfill scripts that map the current book, and a dev-only gallery that renders every template × theme.

**Architecture:** Pure logic lives in `lib/v2/*` (unit-tested with Vitest). Rendering lives in `components/world/*` (SVG scenery + HTML items positioned in design units `u` via a CSS variable). Nothing in Phase 1 is reachable from the live routes; the gallery 404s in production.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Prisma 6 + PostgreSQL, Tailwind 4, sharp, exifr, Vitest, Playwright (system Chrome channel).

## Global Constraints

- Work only in `/Users/jafarfadli/Koding/adventure-book-v2` (branch `v2`); `.env` there targets DB `adventure_book_v2dev` and `uploads/` copy; dev server `next dev -p 3012`.
- Migrations are additive only (no drops, no renames, no type changes).
- Design units: stations are 720u tall; `--u` = px per u.
- Theme keys exactly: `stroberi | senja | matcha | laut | lavender`; legacy `cream→stroberi`, `dusk→lavender`, `kraft→senja`.
- Template keys exactly: `single-tall, single-wide, duo-side, duo-stack, trio, photo-text, duo-text, strip-text, video-tall, video-wide, letter, quote`.
- No emoji in any UI or system copy; icon-only controls carry `aria-label` + `title`.
- UI text ≥ 12px, contrast ≥ 4.5:1. Indonesian copy, minimal.
- TypeScript strict, no `any`; inputs validated with zod.
- Every task ends with `npx tsc --noEmit`, `npm run lint`, `npm test` green and a commit.

---

### Task 1: Test tooling

**Files:**
- Modify: `package.json` (scripts `test`, `test:e2e`; devDeps `vitest`, `@playwright/test`)
- Create: `vitest.config.ts`, `playwright.config.ts`, `lib/v2/smoke.test.ts`

**Produces:** `npm test` (Vitest, `lib/**/*.test.ts`, alias `@` → repo root); `npm run test:e2e` (Playwright, `e2e/**/*.spec.ts`, `channel: "chrome"`, `baseURL: http://localhost:3012/adventure`).

- [ ] Install: `npm i -D vitest @playwright/test`
- [ ] `vitest.config.ts`: `resolve.alias {'@': root}`, `test.include ['lib/**/*.test.ts']`, `environment: 'node'`.
- [ ] `playwright.config.ts`: `testDir: 'e2e'`, `use.channel: 'chrome'`, `use.baseURL`, `expect.toHaveScreenshot.maxDiffPixelRatio: 0.01`, projects `phone` (390×844, dpr 2) and `desktop` (1440×900).
- [ ] `lib/v2/smoke.test.ts`: `expect(1 + 1).toBe(2)`; run `npm test` → 1 passed.
- [ ] Commit `Test tooling: Vitest for lib, Playwright (system Chrome) for e2e`.

### Task 2: Additive Prisma migration

**Files:** Modify `prisma/schema.prisma`; Create `prisma/migrations/<ts>_v2_foundation/migration.sql` (generated).

**Produces (columns):** `Shelf{id,title,editPasswordHash,createdAt,updatedAt,books,wishlist}`; `Book.shelfId?`, `Book.shelfOrder Int @default(0)`, `Book.volume Int?`, `Book.coverText?`, `Book.coverFocusX/Y Float @default(0.5)`, `Book.closingText?`; `Page.template?`, `Page.theme?`, `Page.decorSeed Int @default(0)`; `Slot.focusX/Y Float @default(0.5)`, `Slot.width Int?`, `Slot.height Int?`, `Slot.takenAt DateTime?`, `Slot.showDate Boolean @default(true)`; `WishlistItem.shelfId?`.

- [ ] Edit schema (relations: `Book.shelf` `onDelete: SetNull`, `WishlistItem.shelf` `onDelete: Cascade`, indexes on the new FKs).
- [ ] Assert the target first: `grep -q adventure_book_v2dev .env` then `npx prisma migrate dev --name v2_foundation`.
- [ ] Inspect the SQL: only `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN`, `CREATE INDEX`, `ADD CONSTRAINT ... FOREIGN KEY`. No `DROP`.
- [ ] `npx tsc --noEmit` (Prisma client regenerated), commit `DB: additive v2 columns and Shelf model`.

### Task 3: Theme tokens

**Files:** Create `lib/v2/themes.ts`, `lib/v2/themes.test.ts`.

**Produces:**
```ts
export const THEME_KEYS = ["stroberi","senja","matcha","laut","lavender"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export type ThemeTokens = { key: ThemeKey; label: string; paper: string; c1: string; c2: string; c3: string; c4: string;
  accent: string; cloud: string; sky: string; deep: string; ink: string; night: boolean };
export const THEMES: Record<ThemeKey, ThemeTokens>;
export function isThemeKey(v: unknown): v is ThemeKey;
export function toThemeKey(v: string | null | undefined, fallback?: ThemeKey): ThemeKey; // legacy aware
export function resolvePageTheme(pageTheme: string | null, bookTheme: string): ThemeKey;
export function themeCssVars(t: ThemeTokens): Record<string, string>; // --paper, --c1..--c4, --accent, --cloud, --sky, --deep, --ink
```
Tests: legacy mapping (`cream→stroberi`, `dusk→lavender`, `kraft→senja`, unknown→fallback `stroberi`), page theme null → book theme, every token is a 7-char hex, `themeCssVars` keys.

### Task 4: Dates (Indonesian)

**Files:** Create `lib/v2/dates.ts`, `lib/v2/dates.test.ts`.

**Produces:**
```ts
export function parseIndoDate(label: string | null | undefined): Date | null; // "12 Agustus 2026", "17 Agu 2026", "15 Jul 2026", "23 Juli 2026" → noon Asia/Jakarta (05:00Z)
export function stampParts(d: Date): { day: string; year: string };        // { day: "15 Jul", year: "2026" }
export function monthLabel(d: Date): string;                                // "Agustus 2026"
export function shortMonth(d: Date): string;                                // "Agu"
export function monthKey(d: Date): string;                                  // "2026-08" in Asia/Jakarta
export function dayKey(d: Date): string;                                    // "2026-08-17" in Asia/Jakarta
export function stampDate(slot: { dateLabel: string | null; takenAt: Date | string | null; showDate: boolean }): Date | null;
export function stampText(slot: { dateLabel: string | null; takenAt: Date | string | null; showDate: boolean }): { day: string; year: string } | null;
```
Tests cover every label format present in the live data, month boundaries in Jakarta time, `showDate=false → null`, free-text labels that do not parse → text shown verbatim (stampText returns `{ day: label, year: "" }`).

### Task 5: Seeded RNG

**Files:** Create `lib/v2/rng.ts`, `lib/v2/rng.test.ts`.

**Produces:** `export function hashString(s: string): number` (FNV-1a 32-bit); `export function mulberry32(seed: number): () => number`.
Tests: determinism, range [0,1), different seeds differ.

### Task 6: Template registry

**Files:** Create `lib/v2/templates.ts`, `lib/v2/templates.test.ts`.

**Produces:**
```ts
export const TEMPLATE_KEYS = [...12 keys in spec order] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Ratio = "3:4" | "4:3" | "1:1" | "9:16" | "16:9";
export type FrameSpec = { key: "photo1"|"photo2"|"photo3"|"video1"; kind: "photo"|"video"; ratio: Ratio;
  w: number; x: number; y: number; rot: number };                   // w = media window width (u); x,y = card/film top-left
export type TextSpec = { key: "text1"; kind: "note"|"letter"|"quote"; x: number; y: number; w: number; h: number; rot: number; maxLines: number };
export type StripSpec = { x: number; y: number; rot: number; cell: number };   // strip-text only, photos 1..3
export type AnchorKind = "sky" | "side" | "ground";
export type Anchor = { x: number; y: number; kind: AnchorKind; size: number };
export type TemplateSpec = { key: TemplateKey; label: string; width: number; legacy: Layout;
  frames: FrameSpec[]; text?: TextSpec; strip?: StripSpec; anchors: Anchor[];
  stamp: { frame: string; dx: number; dy: number }; glyph: string /* SVG inner markup, viewBox 0 0 30 22 */ };
export const TEMPLATES: Record<TemplateKey, TemplateSpec>;
export function ratioValue(r: Ratio): number;                         // w/h
export function windowSize(f: FrameSpec): { w: number; h: number };
export function cardBox(f: FrameSpec): { x: number; y: number; w: number; h: number }; // polaroid (12 pad + 46 caption) or film (28 sprocket side, 14 other side)
export function slotSpecs(t: TemplateKey): { key: string; type: "PHOTO"|"VIDEO"|"TEXT" }[];
export function isTemplateKey(v: unknown): v is TemplateKey;
export function deriveTemplate(layout: Layout, slots: { key: string; width: number | null; height: number | null }[]): TemplateKey | null; // null for COVER/CLOSING
export function resolveTemplate(page: { template: string | null; layout: Layout; slots: {...}[] }): TemplateKey | null;
```
Geometry exactly as spec §6. Tests (invariants for all 12): every card/strip/text box lies within `[0,width] × [0,720]` after accounting for ±3° rotation (allow 8u slack); anchors lie inside the station and do not intersect any card box (8u margin); slot keys unique; `legacy` round trip (`deriveTemplate` on each legacy family returns a template whose `legacy` equals it); mapping rules from spec §6 (portrait single → single-tall; both-landscape duo → duo-stack; mixed duo → duo-side; portrait video → video-tall; COVER → null).

### Task 7: Decoration placement

**Files:** Create `lib/v2/decor.ts`, `lib/v2/decor.test.ts`.

**Produces:**
```ts
export type Placed = { anchor: Anchor; sticker: number; rot: number; scale: number };
export function placeDecorations(anchors: Anchor[], pools: Record<AnchorKind, number>, pageId: string, decorSeed: number): Placed[];
```
Rules: rng = `mulberry32(hashString(pageId) ^ decorSeed)`; each anchor kept with p = 0.7 (at least 2 kept per station); sticker index uniform within the pool of its kind, never the same sticker twice on a station when the pool allows; rot ∈ [−12, 12]; scale ∈ [0.85, 1.15]. Tests: deterministic, seed change changes output, counts, no duplicate stickers when pool ≥ anchors.

### Task 8: Custom icon set

**Files:** Create `components/v2/Icon.tsx`.

**Produces:** `export type IconName = "check"|"undo"|"grid"|"book"|"plus"|"photos"|"swap"|"focus"|"calendar"|"pin"|"trash"|"layout"|"dice"|"map"|"spark"|"share"|"music"|"music-off"|"pencil"|"zoom-in"|"drag"|"close"|"chevron-left"|"chevron-right"|"play"|"arrow-right"|"shelf"|"warning"|"spinner"|"cloud-check"|"film"|"text"|"eye-off";`
`export function Icon({ name, className, title }: { name: IconName; className?: string; title?: string }): JSX.Element` — 24×24, `fill="none" stroke="currentColor" strokeWidth=2 strokeLinecap/Join="round"`, `aria-hidden` unless `title`.
`export function IconButton(props: { icon: IconName; label: string; onClick?: () => void; variant?: "plain"|"primary"|"ghost"; pressed?: boolean; disabled?: boolean; className?: string })` — 40px round button, `aria-label=label`, `title=label`, focus-visible ring.
Paths: as drawn in the approved editor prototype (`.superpowers/brainstorm/.../editor-v2.html`).

### Task 9: Shared paper-art primitives

**Files:** Create `lib/v2/shapes.ts` (+ `shapes.test.ts`), `components/world/art/defs.tsx`, `components/world/art/pieces.tsx`.

**Produces:**
- `shapes.ts`: `wavePath(x0,x1,y,amp,period,phase?)`, `scallopPath(x0,x1,y,r)`, `peaksPath(x0,x1,base,step,rand)`, `trailPath(x0,x1,y,amp,period)` — return SVG path `d` strings, closed to y=720 (except trail); tests check they start at x0 and cover ≥ x1.
- `defs.tsx`: `<WorldDefs />` — one hidden `<svg>` with filter ids `ab-lift`, `ab-edge`, `ab-drop`; `GRAIN_URL`, `FELT_URL` data-URI textures.
- `pieces.tsx`: `Cloud`, `Heart`, `Star5`, `Star4`, `Moon`, `Bush` SVG `<g>` components (props `x,y,scale,rot,fill`).

### Task 10: Theme kits (five)

**Files:** Create `components/world/themes/types.ts`, `components/world/themes/{stroberi,senja,matcha,laut,lavender}.tsx`, `components/world/themes/index.ts`.

**Produces:**
```ts
export type Sticker = { name: string; w: number; h: number; draw: () => React.ReactNode };  // drawn centred at 0,0 in u
export type Span = { x0: number; x1: number; seed: number };                                   // in the layer's own u space
export type ThemeKit = { key: ThemeKey;
  sky(span: Span): React.ReactNode; mid(span: Span): React.ReactNode;
  ground(span: Span): React.ReactNode; front(span: Span): React.ReactNode;
  stickers: Record<AnchorKind, Sticker[]>;
  mount: "bow" | "kraft" | "corners" | "stripes" | "dots" };
export const KITS: Record<ThemeKey, ThemeKit>;
```
Art follows the approved theme-kit screen (`theme-kits.html`) and world prototype (`world.html`): colours only from tokens via `var(--c1)` etc.; landscape bands get `filter="url(#ab-edge)"`, floating pieces `url(#ab-lift)`. Each kit ≥ 3 sky, ≥ 3 side, ≥ 3 ground stickers.

### Task 11: Station renderer

**Files:** Create `lib/v2/types.ts`, `components/world/Station.tsx`, `components/world/items/{Polaroid,FilmFrame,Note,Strip,Stamp,Mount,StickerSvg}.tsx`, `components/world/StationScene.tsx`.

**Produces:**
```ts
// lib/v2/types.ts
export type SlotV2 = { key: string; type: "PHOTO"|"VIDEO"|"TEXT"; imageUrl: string|null; thumbUrl: string|null; videoUrl: string|null;
  caption: string|null; text: string|null; focusX: number; focusY: number; dateLabel: string|null; takenAt: string|null;
  showDate: boolean; lat: number|null; lng: number|null; locationLabel: string|null; width: number|null; height: number|null };
export type PageV2 = { id: string; order: number; template: TemplateKey; theme: ThemeKey; decorSeed: number; slots: Record<string, SlotV2> };
// components/world/Station.tsx
export function Station(props: { page: PageV2; lowRes?: boolean; editable?: EditHooks }): JSX.Element; // absolutely positioned items in a width×720u box; uses var(--u)
export function StationScene(props: { page: PageV2; height: number }): JSX.Element;                // self-contained scene (sky+mid+ground+front+station) for gallery/tiles
```
`EditHooks` is an optional prop reserved for Phase 3 (`{ selected?: string; onSelect?: (target: string) => void; renderCaption?: ... }`) — not implemented in Phase 1 beyond the type.

### Task 12: Backfill scripts

**Files:** Create `lib/v2/backfill.ts` (+ `backfill.test.ts`), `scripts/v2/backfill.ts`.

**Produces:** pure planners `planTemplates(pages)`, `planTakenAt(slots)`, `planBookParts(book, pages)`; script `npx tsx scripts/v2/backfill.ts <media-dims|taken-at|templates|book-parts|all> [--dry-run]` that refuses to run unless `DATABASE_URL` ends with `/adventure_book_v2dev` **or** `--allow-prod` is passed (release time only).
Run on the dev DB: expect template counts `single-tall 12, duo-side 9, duo-stack 4, trio 2, video-wide 2, video-tall 1, quote 1`.

### Task 13: Dev gallery + visual snapshot

**Files:** Create `app/dev/gallery/page.tsx`, `e2e/gallery.spec.ts`.

**Produces:** `/dev/gallery` (404 when `NODE_ENV === "production"`): 12 templates × 5 themes using real pages from the dev DB where available, sample media otherwise; `?theme=` and `?t=` filters. Playwright snapshot per theme (phone + desktop).

---

**Phase exit:** gallery reviewed visually (screenshots read and checked against the approved mockups), all tests green, `next build` passes in the worktree.
