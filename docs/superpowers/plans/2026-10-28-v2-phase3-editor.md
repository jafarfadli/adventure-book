# Adventure Book v2 — Phase 3 (Editor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Edit the book in place (spec §8): the reader's own renderer with overlays, one icon dock, sheets, autosave + undo, all-pages grid; the editor's stop render must equal the reader's.

**Architecture:** `WorldCanvas` (shared with the reader) + `components/editor-v2/*`. State lives in `useEditorBook` (optimistic pure edits from `lib/v2/edit.ts`, one ordered server queue, undo inverses). Mutations are `actions/v2/editor.ts` (zod + `requireEditor`, legacy `layout` kept in sync, book parts kept at the ends).

## Tasks (all done)

- [x] Split `World` into `WorldCanvas` + reader chrome; `Station` gains optional edit hooks (selection outline, typing in place with identical typography, focal-point drag).
- [x] `lib/v2/edit.ts` + tests: patchSlot/slotPrev, setPageTemplate (keeps hidden slots), setPageTheme, setPageSeed, insert/remove/reorder, patchBook/bookPrev.
- [x] `actions/v2/editor.ts`: updateSlotV2, setTemplateV2, setPageThemeV2, setDecorSeedV2, createPagesV2 (insert at stop index), deletePageV2 (snapshot) / restorePageV2 (same id), reorderStopsV2, updateBookV2, reloadPagesV2.
- [x] Upload route returns stored width/height and capture time; videos get QuickTime date + ISO 6709 GPS via ffprobe (`lib/v2/media.ts` + tests).
- [x] `lib/v2/bulk.ts` + tests (day groups in Asia/Jakarta, chunks of ≤3 never leaving a single after a three, templates by count/shape, videos alone, undated last).
- [x] Editor UI: `EditorWorld`, `Dock`, `Sheet`, `Glyph`, sheets (`TemplateGrid`, `ThemeRow`, `DatePanel`, `LocationPanel` with drawn pin, `AddPanel` with bulk upload + review, `BookPanel`, `PagesOverlay` with dnd-kit), `UnlockV2`; `/edit` and `/unlock` switch to v2 with the flag.
- [x] E2E: `auth.setup.ts` (one login per run — the session route is rate-limited), `editor.spec.ts` (caption in place + reload, undo, shuffle/template undo, add/delete/undo-delete, pages grid), `parity.spec.ts` (reader vs editor stop renders: zero visibly different pixels). Suites run with one worker (shared dev DB).
