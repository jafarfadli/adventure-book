# Adventure Book v2 — Phase 2 (World reader) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/book/our-story?v=2` renders the whole book as one full-screen, horizontally scrolling paper world (spec §5, §7) on phone and desktop.

**Architecture:** `lib/v2/world.ts` (done) lays out segments/slices; `lib/v2/scale.ts` maps the viewport to px-per-unit and the 720u band; `components/world/World.tsx` owns the scroll container, parallax and sky; `Scenery.tsx` renders per-slice layer SVGs (bands clipped to the slice, items free); `Items.tsx` renders stations + start/sign/end; `Cover.tsx`, `Timeline.tsx`, `ReaderChrome.tsx`; `lib/v2/book.ts` loads the DTO; `app/book/[slug]/page.tsx` switches v1/v2 per request.

**Tech Stack:** as Phase 1.

## Global Constraints
(same as Phase 1) plus: one rAF-throttled scroll handler writes only transforms/background; parallax factors far 0.22, mid 0.55, ground/items 1, front 1.16; `prefers-reduced-motion` → all factors 1, no cover animation, instant jumps; deep links `?p=<pageId>` and legacy `?page=<order>` skip the cover.

### Task 1: Scale
`lib/v2/scale.ts` (+ test): `worldScale(vw, vh) → { s, bandTop, topU, bottomU }` with `s = min(vh/720, vw/460)`, `bandTop = (vh − 720s)·0.6`, `topU = −bandTop/s`, `bottomU = (vh − bandTop − 720s)/s`.

### Task 2: Book loader
`lib/v2/book.ts`: `loadBookV2(slug) → BookV2 | null` — book meta (title, volume, theme, cover image/focus/text, closing text), stops (`toPageV2`, COVER/CLOSING skipped), stats (stops count, media count, first/last date), top-3 undone wishlist items, earliest date.

### Task 3: Scenery
`components/world/Scenery.tsx`: `<SceneryLayer layer="sky|mid|ground|front" f slices width s topU bottomU vw />` — one absolutely positioned div per layer, one `<div style="content-visibility:auto">` + `<svg>` per slice in layer space (`x ↦ f·x + (1−f)·vw/2`), theme CSS vars per slice, bands under a per-slice `clipPath`, items unclipped; ground layer adds the dotted trail and seam bushes; front layer extends the deep colour to the bottom of the screen.

### Task 4: Items + book parts
`components/world/Items.tsx`: stations at segment x (`lowRes` when far), `StartSign` (title, vol., "dimulai …", arrow), `MonthSign`, `EndSegment` (bersambung + stats + closing text + up to 3 wishlist signposts linking to the wishlist + close-book button).

### Task 5: World shell
`components/world/World.tsx`: measures the stage (ResizeObserver), lays out, renders layers, rAF scroll handler (parallax transforms, sky colour, timeline knob), wheel→horizontal, ←/→ jump between stops, initial scroll to deep-linked stop.

### Task 6: Cover, back cover, timeline, chrome
`Cover.tsx` (closed book art: felt board, spine stitching, die-cut arch window with cover photo + focus, title label, vol., cover note, corners, ribbon), `CoverOverlay` (first visit per session, tap to open; reduced motion instant), `BackCover` overlay; `Timeline.tsx` (dots per stop, month labels, draggable knob); `ReaderChrome.tsx` (map, wishlist, share, music, edit — icons only).

### Task 7: Route switch
`app/book/[slug]/page.tsx`: v2 when `process.env.ADVENTURE_V2 === "1"` or `?v=2` (and not `?v=1`); otherwise the existing v1 reader. Metadata unchanged.

### Task 8: Verification
`e2e/reader.spec.ts`: cover → open → world visible → scroll moves parallax (far layer transform changes) → `?p=` deep link centres the stop and skips the cover → keyboard ArrowRight moves to the next stop. Visual review of screenshots at 390×844 and 1440×900 against the approved prototype C.
