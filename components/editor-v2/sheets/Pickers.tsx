"use client";

import { Icon, IconButton } from "@/components/v2/Icon";
import { stampParts } from "@/lib/v2/dates";
import { TEMPLATE_KEYS, TEMPLATES, type TemplateKey } from "@/lib/v2/templates";
import { THEME_KEYS, THEMES, type ThemeKey } from "@/lib/v2/themes";
import type { SlotV2 } from "@/lib/v2/types";
import { slotDate } from "@/lib/v2/dates";
import type { SlotPatch } from "@/lib/v2/edit";
import { Glyph } from "../Glyph";

/** 12 layout pictograms; the current one is filled. */
export function TemplateGrid({ current, onPick }: { current?: TemplateKey; onPick: (t: TemplateKey) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {TEMPLATE_KEYS.map((t) => (
        <button
          key={t}
          type="button"
          aria-label={TEMPLATES[t].label}
          title={TEMPLATES[t].label}
          aria-pressed={t === current}
          onClick={() => onPick(t)}
          className={`grid h-14 place-items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-[#2b2326] ${
            t === current ? "bg-[#2b2326] text-white" : "bg-[#f4eef0] text-[#5f5257] hover:bg-[#ece3e7]"
          }`}
        >
          <Glyph template={t} className="h-7 w-10" />
        </button>
      ))}
    </div>
  );
}

/** "Follow the book" (ring around the book's colour) plus the five themes. */
export function ThemeRow({
  current,
  bookTheme,
  onPick,
  allowFollow = true,
}: {
  current: ThemeKey | null;
  bookTheme: ThemeKey;
  onPick: (t: ThemeKey | null) => void;
  allowFollow?: boolean;
}) {
  const ring = (on: boolean) => (on ? "0 0 0 3px #fffaf5, 0 0 0 5px #2b2326" : "0 0 0 3px #fffaf5, 0 0 0 4px rgba(0,0,0,0.12)");
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {allowFollow && (
        <button
          type="button"
          aria-label="Ikut tema buku"
          title="Ikut tema buku"
          aria-pressed={current === null}
          onClick={() => onPick(null)}
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-[#8a7f84] text-white"
          style={{ boxShadow: ring(current === null), background: THEMES[bookTheme].c3 }}
        >
          <Icon name="book" className="h-5 w-5" />
        </button>
      )}
      {THEME_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          aria-label={`Tema ${THEMES[k].label}`}
          title={THEMES[k].label}
          aria-pressed={current === k}
          onClick={() => onPick(k)}
          className="h-10 w-10 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2b2326]"
          style={{ background: THEMES[k].c3, boxShadow: ring(current === k) }}
        />
      ))}
    </div>
  );
}

const WIB = 7 * 60 * 60 * 1000;
const toInput = (d: Date) => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
const fromInput = (v: string) => new Date(`${v}T12:00:00+07:00`).toISOString();

/** Date of a photo: the native picker, hide/show the stamp, clear. */
export function DatePanel({ slot, onChange, onDone }: { slot: SlotV2; onChange: (p: SlotPatch) => void; onDone: () => void }) {
  const d = slotDate(slot);
  const parts = d ? stampParts(d) : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 min-w-12 place-items-center rounded-full bg-[#d6688a] px-3 text-center font-hand text-lg leading-none font-bold text-white">
          {parts ? (
            <span>
              {parts.day}
              <br />
              <span className="text-sm font-normal">{parts.year}</span>
            </span>
          ) : (
            <Icon name="calendar" />
          )}
        </span>
        <input
          type="date"
          aria-label="Tanggal"
          value={d ? toInput(d) : ""}
          onChange={(e) => e.target.value && onChange({ takenAt: fromInput(e.target.value), dateLabel: null, showDate: true })}
          className="h-12 flex-1 rounded-xl border border-[#e7dfe2] bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-[#2b2326]"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <IconButton
            icon="eye-off"
            label={slot.showDate ? "Sembunyikan stempel tanggal" : "Tampilkan stempel tanggal"}
            pressed={!slot.showDate}
            onClick={() => onChange({ showDate: !slot.showDate })}
            variant="ghost"
          />
          <IconButton icon="trash" label="Hapus tanggal" onClick={() => onChange({ takenAt: null, dateLabel: null })} variant="ghost" />
        </div>
        <IconButton icon="check" label="Selesai" onClick={onDone} variant="primary" />
      </div>
    </div>
  );
}
