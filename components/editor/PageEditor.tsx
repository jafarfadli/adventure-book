"use client";

import { Layout } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { setPageLayout } from "@/actions/slots";
import { renderLayout, type BookMeta } from "@/components/reader/layouts";
import { PageCanvas, PAGE_H, PAGE_W } from "@/components/reader/PageCanvas";
import { useToast } from "@/components/ui/Toaster";
import { LAYOUTS } from "@/lib/layouts";
import { getTheme } from "@/lib/themes";
import type { PageData, SlotData } from "@/lib/types";
import { SlotEditor } from "./SlotEditor";

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

function emptySlot(key: string, type: SlotData["type"]): SlotData {
  return {
    key,
    type,
    imageUrl: null,
    thumbUrl: null,
    videoUrl: null,
    aspect: null,
    caption: null,
    text: null,
    rotation: 0,
    tapeStyle: null,
    dateLabel: null,
    lat: null,
    lng: null,
    locationLabel: null,
    locationSource: null,
  };
}

function slotsFromPage(page: PageData): Record<string, SlotData> {
  const map: Record<string, SlotData> = {};
  for (const spec of LAYOUTS[page.layout].slots) {
    map[spec.key] =
      page.slots.find((s) => s.key === spec.key) ?? emptySlot(spec.key, spec.type);
  }
  return map;
}

function slotHasContent(slot: SlotData): boolean {
  return Boolean(slot.imageUrl || slot.caption || slot.text || slot.dateLabel);
}

export function PageEditor({
  page,
  bookMeta,
  themeKey,
  draft,
  onDraftChange,
}: {
  page: PageData;
  bookMeta: BookMeta;
  themeKey: string;
  /** Kept by the shell so edits survive collapsing the page. */
  draft?: Record<string, SlotData>;
  onDraftChange: (pageId: string, slots: Record<string, SlotData>) => void;
}) {
  const [slots, setSlots] = useState(() => draft ?? slotsFromPage(page));
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Adopt fresh server state after layout switches, unless the shell is
  // already holding unsaved edits for this page.
  useEffect(() => {
    if (!draft) setSlots(slotsFromPage(page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function update(next: Record<string, SlotData>) {
    setSlots(next);
    onDraftChange(page.id, next);
  }

  const theme = getTheme(themeKey);
  const specs = LAYOUTS[page.layout].slots;

  function onLayoutChange(next: Layout) {
    if (next === page.layout) return;
    const nextKeys = new Set(LAYOUTS[next].slots.map((s) => s.key));
    const dropped = page.slots.filter(
      (s) => slotHasContent(s) && !nextKeys.has(s.key),
    );
    if (dropped.length > 0) {
      const ok = confirm(
        `Ganti layout ke "${LAYOUTS[next].label}"? Isi ${dropped.length} slot yang tidak terpakai akan dihapus.`,
      );
      if (!ok) return;
    }
    startTransition(async () => {
      try {
        await setPageLayout(page.id, next);
      } catch {
        toast("Gagal mengganti layout. Coba lagi, ya.");
      }
    });
  }

  const previewPage: PageData = { ...page, slots: Object.values(slots) };

  return (
    <div className="flex flex-col gap-5 rounded-b-lg border-t border-stone-200 bg-stone-50/80 p-4">
      <label className="flex max-w-xs flex-col gap-1 text-sm text-stone-600">
        Layout
        <select
          value={page.layout}
          onChange={(e) => onLayoutChange(e.target.value as Layout)}
          disabled={pending}
          className={inputCls}
        >
          {(Object.keys(LAYOUTS) as Layout[]).map((key) => (
            <option key={key} value={key}>
              {LAYOUTS[key].label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {specs.map((spec) => (
            <SlotEditor
              key={`${page.layout}-${spec.key}`}
              spec={spec}
              value={slots[spec.key] ?? emptySlot(spec.key, spec.type)}
              onChange={(v) => update({ ...slots, [spec.key]: v })}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Pratinjau
          </span>
          {/* Exactly the reader's page box, so the preview is the real
              composition at a smaller zoom. */}
          <PageCanvas
            className={`rounded-md shadow-inner ${
              page.layout === "COVER" ? "bg-[#ff97d0]" : `paper-texture ${theme.paper}`
            }`}
            style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
          >
            <div className="h-full w-full p-8">
              {renderLayout(previewPage, bookMeta, theme)}
            </div>
          </PageCanvas>
        </div>
      </div>
    </div>
  );
}
