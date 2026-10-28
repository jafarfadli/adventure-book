"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  createPagesV2,
  deletePageV2,
  reorderStopsV2,
  restorePageV2,
  setDecorSeedV2,
  setPageThemeV2,
  setTemplateV2,
  updateBookV2,
  updateSlotV2,
  type PageDraft,
  type PageSnapshot,
} from "@/actions/v2/editor";
import {
  bookPrev,
  insertPages,
  patchBook,
  patchSlot,
  removePage,
  reorderPages,
  setPageSeed,
  setPageTemplate,
  setPageTheme,
  slotPrev,
  type BookPatch,
  type SlotPatch,
} from "@/lib/v2/edit";
import type { TemplateKey } from "@/lib/v2/templates";
import type { ThemeKey } from "@/lib/v2/themes";
import type { BookV2, PageV2 } from "@/lib/v2/types";

export type SaveStatus = "saved" | "saving" | "error";

/** A server call that builds its payload when it runs, so a retry always sends the latest state. */
type Task = () => Promise<unknown>;

/**
 * The editor's copy of the book. Every change is applied locally at once
 * (optimistic), sent to the server through one ordered queue, and leaves an
 * inverse on the undo stack. A failed save keeps the local state and shows
 * the warning icon; retrying re-runs the failed calls, which read the
 * current state when they run (never an older value over a newer one) and
 * apply their own results.
 */
export function useEditorBook(initial: BookV2) {
  const [book, setBook] = useState(initial);
  const bookRef = useRef(book);
  bookRef.current = book;

  const [status, setStatus] = useState<SaveStatus>("saved");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const inFlight = useRef(0);
  const failed = useRef<Task[]>([]);

  const undoStack = useRef<(() => void)[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const apply = useCallback((f: (b: BookV2) => BookV2) => {
    bookRef.current = f(bookRef.current);
    setBook(bookRef.current);
  }, []);

  // stops deleted here whose delete has not reached the server yet: calls
  // queued before it still send them as they were, and a reorder still lists them
  const deleting = useRef(new Map<string, PageV2>());

  /** The page as the editor shows it. */
  const local = useCallback((pageId: string): PageV2 | undefined => bookRef.current.pages.find((p) => p.id === pageId), []);
  /** The page as a queued call should send it: also one the server has not deleted yet. */
  const page = useCallback((pageId: string): PageV2 | undefined => local(pageId) ?? deleting.current.get(pageId), [local]);

  /**
   * Queue a call after every earlier one. Resolves to the call's result, or
   * undefined if it failed — in which case it is kept for retry unless
   * `retryable` is false (creating stops: the add sheet keeps the batch so
   * nothing is created twice).
   */
  const send = useCallback(<T,>(task: () => Promise<T>, retryable = true): Promise<T | undefined> => {
    inFlight.current++;
    setStatus("saving");
    const run = queue.current.then(async () => {
      try {
        return await task();
      } catch {
        if (retryable) failed.current.push(task);
        return undefined;
      } finally {
        inFlight.current--;
        if (inFlight.current === 0) setStatus(failed.current.length ? "error" : "saved");
      }
    });
    queue.current = run.then(() => undefined);
    return run;
  }, []);

  const retry = useCallback(() => {
    const tasks = failed.current.splice(0);
    tasks.forEach((t) => void send(t));
  }, [send]);

  const pushUndo = useCallback((inverse: () => void) => {
    undoStack.current.push(inverse);
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const inverse = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    try {
      inverse?.();
    } catch {
      // the stop it refers to is gone (a quick double undo while a restore is
      // still on its way): nothing left to undo for this entry
    }
  }, []);

  // ---------------------------------------------------------------- slots

  /** Send the current values of these fields of one slot (latest state wins). */
  const sendSlotFields = useCallback(
    (pageId: string, key: string, fields: (keyof SlotPatch)[]) =>
      send(() => {
        const slot = page(pageId)?.slots[key];
        if (!slot) return Promise.resolve();
        const patch: Record<string, unknown> = {};
        for (const f of fields) patch[f] = slot[f];
        return updateSlotV2(pageId, key, patch as SlotPatch);
      }),
    [send, page],
  );

  const editSlot = useCallback(
    (pageId: string, key: string, patch: SlotPatch, record = true) => {
      const prev = slotPrev(bookRef.current, pageId, key, patch);
      apply((b) => patchSlot(b, pageId, key, patch));
      void sendSlotFields(pageId, key, Object.keys(patch) as (keyof SlotPatch)[]);
      if (record) pushUndo(() => editSlot(pageId, key, prev, false));
    },
    [apply, sendSlotFields, pushUndo],
  );

  // typing: local on every keystroke, saved after a pause, one undo per session
  const typing = useRef<{ pageId: string; key: string; field: "caption" | "text"; prev: SlotPatch; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const flushTyping = useCallback(() => {
    const t = typing.current;
    if (!t) return;
    if (t.timer) clearTimeout(t.timer);
    t.timer = null;
    void sendSlotFields(t.pageId, t.key, [t.field]);
  }, [sendSlotFields]);

  const type = useCallback(
    (pageId: string, key: string, field: "caption" | "text", value: string) => {
      let t = typing.current;
      if (!t || t.pageId !== pageId || t.key !== key || t.field !== field) {
        if (t) flushTyping();
        t = typing.current = { pageId, key, field, prev: slotPrev(bookRef.current, pageId, key, { [field]: null }), timer: null };
      }
      apply((b) => patchSlot(b, pageId, key, { [field]: value }));
      if (t.timer) clearTimeout(t.timer);
      t.timer = setTimeout(flushTyping, 500);
    },
    [apply, flushTyping],
  );

  const endTyping = useCallback(() => {
    const t = typing.current;
    if (!t) return;
    flushTyping();
    typing.current = null;
    const now = local(t.pageId)?.slots[t.key]?.[t.field] ?? null;
    if ((now ?? "") !== (t.prev[t.field] ?? "")) pushUndo(() => editSlot(t.pageId, t.key, t.prev, false));
  }, [flushTyping, pushUndo, editSlot, local]);

  // focal point: live while dragging, saved (and undoable) on release
  const focusStart = useRef<SlotPatch | null>(null);
  const focus = useCallback(
    (pageId: string, key: string, x: number, y: number, done: boolean) => {
      if (!focusStart.current) focusStart.current = slotPrev(bookRef.current, pageId, key, { focusX: x, focusY: y });
      apply((b) => patchSlot(b, pageId, key, { focusX: x, focusY: y }));
      if (done) {
        const prev = focusStart.current;
        focusStart.current = null;
        void sendSlotFields(pageId, key, ["focusX", "focusY"]);
        pushUndo(() => editSlot(pageId, key, prev, false));
      }
    },
    [apply, sendSlotFields, pushUndo, editSlot],
  );

  // ---------------------------------------------------------------- pages

  const setTemplate = useCallback(
    (pageId: string, template: TemplateKey, record = true) => {
      const prev = local(pageId)?.template;
      apply((b) => setPageTemplate(b, pageId, template));
      void send(() => {
        const p = page(pageId);
        return p ? setTemplateV2(pageId, p.template) : Promise.resolve();
      });
      if (record && prev) pushUndo(() => setTemplate(pageId, prev, false));
    },
    [apply, send, pushUndo, local, page],
  );

  const setTheme = useCallback(
    (pageId: string, theme: ThemeKey | null, record = true) => {
      const prev = local(pageId)?.ownTheme ?? null;
      apply((b) => setPageTheme(b, pageId, theme));
      void send(() => {
        const p = page(pageId);
        return p ? setPageThemeV2(pageId, p.ownTheme) : Promise.resolve();
      });
      if (record) pushUndo(() => setTheme(pageId, prev, false));
    },
    [apply, send, pushUndo, local, page],
  );

  const setSeed = useCallback(
    (pageId: string, seed: number, record = true) => {
      const prev = local(pageId)?.decorSeed ?? 0;
      apply((b) => setPageSeed(b, pageId, seed));
      void send(() => {
        const p = page(pageId);
        return p ? setDecorSeedV2(pageId, p.decorSeed) : Promise.resolve();
      });
      if (record) pushUndo(() => setSeed(pageId, prev, false));
    },
    [apply, send, pushUndo, local, page],
  );

  const deletePage = useCallback(
    (pageId: string, record = true) => {
      const removed = local(pageId);
      if (!removed) return;
      const { index } = removePage(bookRef.current, pageId);
      apply((b) => removePage(b, pageId).book);
      deleting.current.set(pageId, removed);
      // the snapshot is kept here rather than in a result, so it survives a retry
      let snapshot: PageSnapshot | undefined;
      const del = async () => {
        snapshot = await deletePageV2(pageId);
        deleting.current.delete(pageId);
      };
      void send(del);
      if (record)
        pushUndo(() => {
          // queued behind the delete, so it sees how that went
          void send(async () => {
            if (!snapshot) {
              // the delete never reached the server: drop it and put the page back
              failed.current = failed.current.filter((t) => t !== del);
              deleting.current.delete(pageId);
              apply((b) => (b.pages.some((p) => p.id === pageId) ? b : insertPages(b, index, [removed])));
              return;
            }
            const restored = await restorePageV2(bookRef.current.id, snapshot, index);
            apply((b) => (b.pages.some((p) => p.id === restored.id) ? b : insertPages(b, index, [restored])));
          });
        });
    },
    [apply, send, pushUndo, local],
  );

  /** Create stops; resolves to [] if the server refused (the caller keeps its draft). */
  const createPages = useCallback(
    async (index: number, drafts: PageDraft[]) => {
      const pages = await send(() => createPagesV2(bookRef.current.id, index, drafts), false);
      if (!pages || pages.length === 0) return [];
      apply((b) => insertPages(b, index, pages));
      pushUndo(() => pages.forEach((p) => deletePage(p.id, false)));
      return pages;
    },
    [apply, send, pushUndo, deletePage],
  );

  const reorder = useCallback(
    (ids: string[], record = true) => {
      const prev = bookRef.current.pages.map((p) => p.id);
      // keep the requested order for pages that still exist, others after
      const have = new Set(prev);
      const wanted = ids.filter((id) => have.has(id));
      const next = [...wanted, ...prev.filter((id) => !wanted.includes(id))];
      apply((b) => reorderPages(b, next));
      // the server's list still holds stops whose delete is queued behind this
      void send(() =>
        reorderStopsV2(bookRef.current.id, [...bookRef.current.pages.map((p) => p.id), ...deleting.current.keys()]),
      );
      if (record) pushUndo(() => reorder(prev, false));
    },
    [apply, send, pushUndo],
  );

  const editBook = useCallback(
    (patch: BookPatch, record = true) => {
      const prev = bookPrev(bookRef.current, patch);
      apply((b) => patchBook(b, patch));
      const fields = Object.keys(patch) as (keyof BookPatch)[];
      void send(() => {
        const cur: Record<string, unknown> = {};
        for (const f of fields) cur[f] = bookRef.current[f];
        return updateBookV2(bookRef.current.id, cur as BookPatch);
      });
      if (record) pushUndo(() => editBook(prev, false));
    },
    [apply, send, pushUndo],
  );

  return useMemo(
    () => ({
      book,
      status,
      retry,
      canUndo,
      undo,
      editSlot,
      type,
      endTyping,
      focus,
      setTemplate,
      setTheme,
      setSeed,
      deletePage,
      createPages,
      reorder,
      editBook,
    }),
    [book, status, retry, canUndo, undo, editSlot, type, endTyping, focus, setTemplate, setTheme, setSeed, deletePage, createPages, reorder, editBook],
  );
}

export type EditorApi = ReturnType<typeof useEditorBook>;
