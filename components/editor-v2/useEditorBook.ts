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
import type { BookV2 } from "@/lib/v2/types";

export type SaveStatus = "saved" | "saving" | "error";

/**
 * The editor's copy of the book. Every change is applied locally at once
 * (optimistic), sent to the server through one ordered queue, and leaves an
 * inverse on the undo stack. A failed save keeps the local state, shows the
 * warning icon and can be retried; nothing is ever lost silently.
 */
export function useEditorBook(initial: BookV2) {
  const [book, setBook] = useState(initial);
  const bookRef = useRef(book);
  bookRef.current = book;

  const [status, setStatus] = useState<SaveStatus>("saved");
  const queue = useRef<Promise<void>>(Promise.resolve());
  const inFlight = useRef(0);
  const failed = useRef<(() => Promise<unknown>)[]>([]);

  const undoStack = useRef<(() => void)[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const apply = useCallback((f: (b: BookV2) => BookV2) => {
    bookRef.current = f(bookRef.current);
    setBook(bookRef.current);
  }, []);

  /** Run a server call after every earlier one, tracking the save status. */
  const send = useCallback(<T,>(task: () => Promise<T>): Promise<T | undefined> => {
    inFlight.current++;
    setStatus("saving");
    const run = queue.current.then(async () => {
      try {
        return await task();
      } catch {
        failed.current.push(task);
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
    inverse?.();
  }, []);

  // ---------------------------------------------------------------- slots

  const editSlot = useCallback(
    (pageId: string, key: string, patch: SlotPatch, record = true) => {
      const prev = slotPrev(bookRef.current, pageId, key, patch);
      apply((b) => patchSlot(b, pageId, key, patch));
      void send(() => updateSlotV2(pageId, key, patch));
      if (record) pushUndo(() => editSlot(pageId, key, prev, false));
    },
    [apply, send, pushUndo],
  );

  // typing: local on every keystroke, saved after a pause, one undo per session
  const typing = useRef<{ pageId: string; key: string; field: "caption" | "text"; prev: SlotPatch; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const flushTyping = useCallback(() => {
    const t = typing.current;
    if (!t) return;
    if (t.timer) clearTimeout(t.timer);
    t.timer = null;
    const value = bookRef.current.pages.find((p) => p.id === t.pageId)?.slots[t.key]?.[t.field] ?? null;
    void send(() => updateSlotV2(t.pageId, t.key, { [t.field]: value }));
  }, [send]);

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
    const now = bookRef.current.pages.find((p) => p.id === t.pageId)?.slots[t.key]?.[t.field] ?? null;
    if ((now ?? "") !== (t.prev[t.field] ?? "")) pushUndo(() => editSlot(t.pageId, t.key, t.prev, false));
  }, [flushTyping, pushUndo, editSlot]);

  // focal point: live while dragging, saved (and undoable) on release
  const focusStart = useRef<SlotPatch | null>(null);
  const focus = useCallback(
    (pageId: string, key: string, x: number, y: number, done: boolean) => {
      if (!focusStart.current) focusStart.current = slotPrev(bookRef.current, pageId, key, { focusX: x, focusY: y });
      apply((b) => patchSlot(b, pageId, key, { focusX: x, focusY: y }));
      if (done) {
        const prev = focusStart.current;
        focusStart.current = null;
        void send(() => updateSlotV2(pageId, key, { focusX: x, focusY: y }));
        pushUndo(() => editSlot(pageId, key, prev, false));
      }
    },
    [apply, send, pushUndo, editSlot],
  );

  // ---------------------------------------------------------------- pages

  const setTemplate = useCallback(
    (pageId: string, template: TemplateKey, record = true) => {
      const prev = bookRef.current.pages.find((p) => p.id === pageId)?.template;
      apply((b) => setPageTemplate(b, pageId, template));
      void send(() => setTemplateV2(pageId, template));
      if (record && prev) pushUndo(() => setTemplate(pageId, prev, false));
    },
    [apply, send, pushUndo],
  );

  const setTheme = useCallback(
    (pageId: string, theme: ThemeKey | null, record = true) => {
      const prev = bookRef.current.pages.find((p) => p.id === pageId)?.ownTheme ?? null;
      apply((b) => setPageTheme(b, pageId, theme));
      void send(() => setPageThemeV2(pageId, theme));
      if (record) pushUndo(() => setTheme(pageId, prev, false));
    },
    [apply, send, pushUndo],
  );

  const setSeed = useCallback(
    (pageId: string, seed: number, record = true) => {
      const prev = bookRef.current.pages.find((p) => p.id === pageId)?.decorSeed ?? 0;
      apply((b) => setPageSeed(b, pageId, seed));
      void send(() => setDecorSeedV2(pageId, seed));
      if (record) pushUndo(() => setSeed(pageId, prev, false));
    },
    [apply, send, pushUndo],
  );

  const deletePage = useCallback(
    (pageId: string, record = true) => {
      const { index } = removePage(bookRef.current, pageId);
      apply((b) => removePage(b, pageId).book);
      const snap = send(() => deletePageV2(pageId));
      if (record)
        pushUndo(() => {
          void snap.then((s?: PageSnapshot) => {
            if (!s) return;
            void send(() => restorePageV2(bookRef.current.id, s, index)).then((page) => {
              if (page) apply((b) => insertPages(b, index, [page]));
            });
          });
        });
    },
    [apply, send, pushUndo],
  );

  const createPages = useCallback(
    async (index: number, drafts: PageDraft[]) => {
      const pages = await send(() => createPagesV2(bookRef.current.id, index, drafts));
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
      apply((b) => reorderPages(b, ids));
      void send(() => reorderStopsV2(bookRef.current.id, ids));
      if (record) pushUndo(() => reorder(prev, false));
    },
    [apply, send, pushUndo],
  );

  const editBook = useCallback(
    (patch: BookPatch, record = true) => {
      const prev = bookPrev(bookRef.current, patch);
      apply((b) => patchBook(b, patch));
      void send(() => updateBookV2(bookRef.current.id, patch));
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
