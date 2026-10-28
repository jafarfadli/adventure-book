# Adventure Book v2 — Phase 5 (Shelf) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Many books on one shelf (spec §10): shelf landing, one password for every book, new volumes, shelf-level map and wishlist.

## Tasks (all done)

- [x] Sessions carry `shelfId` next to `bookId` (v1 tokens stay valid); `canEditBook`, `requireEditor` (book or its shelf), `requireShelfEditor`; `/api/session` verifies the shelf's hash for books on a shelf.
- [x] Backfill step `shelf`: one shelf titled after the first book, hash copied (password unchanged), books attached with order/volume, wishlist moved; idempotent.
- [x] `lib/v2/shelf.ts` loader; `lib/v2/slug.ts` (+ tests); `actions/v2/shelf.ts`: `createBookV2` (next volume, unique slug), wishlist add/tick/delete, `deleteEmptyBookV2` (only books without stops).
- [x] `/` → `Shelf` (books face-out on a paper plank, ghost ＋ for editors, create sheet); `/map` → every geotagged photo/video of the shelf with polaroid pins and per-book filter dots; `/wishlist` → lined paper with drawn boxes and pen strokes, inline editing + undo; old per-book map/wishlist routes redirect in v2; reader chrome links to the shelf.
- [x] E2E `shelf.spec.ts`: shelf → book, new volume → delete while empty, wishlist add/tick/remove/undo/remove, map pins → stop.
