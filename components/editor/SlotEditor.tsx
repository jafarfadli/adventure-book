"use client";

import type { SlotSpec } from "@/lib/layouts";
import type { SlotData } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

const TAPE_OPTIONS = [
  { value: "", label: "Tanpa selotip" },
  { value: "classic", label: "Selotip krem" },
  { value: "pink", label: "Selotip pink" },
  { value: "mint", label: "Selotip mint" },
];

export function SlotEditor({
  spec,
  value,
  onChange,
}: {
  spec: SlotSpec;
  value: SlotData;
  onChange: (v: SlotData) => void;
}) {
  if (spec.type === "TEXT") {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm text-stone-600">{spec.label}</label>
        <textarea
          value={value.text ?? ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          rows={4}
          maxLength={5000}
          className={`${inputCls} resize-y font-hand-alt`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-stone-600">{spec.label}</span>
      <ImageUploader
        value={{ imageUrl: value.imageUrl, thumbUrl: value.thumbUrl }}
        onChange={(m) => onChange({ ...value, ...m })}
      />
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Caption
        <input
          value={value.caption ?? ""}
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
          maxLength={300}
          className={inputCls}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Tanggal (mis. 14 Feb 2025)
          <input
            value={value.dateLabel ?? ""}
            onChange={(e) => onChange({ ...value, dateLabel: e.target.value })}
            maxLength={60}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Selotip
          <select
            value={value.tapeStyle ?? ""}
            onChange={(e) => onChange({ ...value, tapeStyle: e.target.value || null })}
            className={inputCls}
          >
            {TAPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Kemiringan ({value.rotation.toFixed(0)}°)
        <input
          type="range"
          min={-6}
          max={6}
          step={1}
          value={value.rotation}
          onChange={(e) => onChange({ ...value, rotation: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
