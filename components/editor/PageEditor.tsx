"use client";

import { Layout } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { setPageLayout, upsertSlot } from "@/actions/slots";
import { renderLayout, type BookMeta } from "@/components/reader/layouts";
import { useToast } from "@/components/ui/Toaster";
import { LAYOUTS } from "@/lib/layouts";
import { getTheme } from "@/lib/themes";
import type { PageData, SlotData } from "@/lib/types";
import { SlotEditor } from "./SlotEditor";

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

function emptySlot(key: string, type: "PHOTO" | "TEXT"): SlotData {
  return {
    key,
    type,
    imageUrl: null,
    thumbUrl: null,
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
}: {
  page: PageData;
  bookMeta: BookMeta;
  themeKey: string;
}) {
  const [slots, setSlots] = useState(() => slotsFromPage(page));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Adopt fresh server state after saves / layout switches.
  useEffect(() => setSlots(slotsFromPage(page)), [page]);

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

  function onSave() {
    setSaved(false);
    startTransition(async () => {
      try {
        for (const spec of specs) {
          const s = slots[spec.key];
          await upsertSlot(page.id, spec.key, {
            caption: s.caption,
            text: s.text,
            imageUrl: s.imageUrl,
            thumbUrl: s.thumbUrl,
            rotation: s.rotation,
            tapeStyle: s.tapeStyle,
            dateLabel: s.dateLabel,
            lat: s.lat,
            lng: s.lng,
            locationLabel: s.locationLabel,
            locationSource: s.locationSource as "exif" | "manual" | null,
          });
        }
        setSaved(true);
      } catch {
        toast("Gagal menyimpan halaman. Coba lagi, ya.");
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
              onChange={(v) => setSlots((prev) => ({ ...prev, [spec.key]: v }))}
            />
          ))}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {pending ? "Menyimpan…" : "Simpan halaman"}
            </button>
            {saved && <span className="text-sm text-emerald-700">Tersimpan ✓</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Pratinjau
          </span>
          <div
            className={`@container min-h-72 rounded-md p-6 shadow-inner ${
              page.layout === "COVER"
                ? "bg-[#ff97d0]"
                : `paper-texture ${theme.paper}`
            }`}
          >
            {renderLayout(previewPage, bookMeta, theme)}
          </div>
        </div>
      </div>
    </div>
  );
}
