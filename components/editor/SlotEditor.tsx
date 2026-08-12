"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FRAME_FORMATS, FRAME_LABELS, toFrameFormat } from "@/lib/frames";
import type { SlotSpec } from "@/lib/layouts";
import { TAPE_STYLES } from "@/lib/tapes";
import type { SlotData } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";
import { VideoUploader } from "./VideoUploader";

// Leaflet touches `window` at import time — client-only, no SSR.
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 w-full items-center justify-center rounded-md bg-stone-100 text-sm text-stone-400">
      Memuat peta…
    </div>
  ),
});

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

const TAPE_OPTIONS = [
  { value: "", label: "Tanpa selotip" },
  ...Object.entries(TAPE_STYLES).map(([value, { label }]) => ({
    value,
    label: `Selotip ${label.toLowerCase()}`,
  })),
];

function FormatPicker({
  value,
  onChange,
}: {
  value: SlotData;
  onChange: (v: SlotData) => void;
}) {
  const current = toFrameFormat(value.aspect);
  return (
    <div className="flex flex-col gap-1 text-sm text-stone-600">
      Format frame
      <div className="flex gap-2">
        {FRAME_FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChange({ ...value, aspect: f })}
            aria-pressed={current === f}
            className={`flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-2 transition focus-visible:outline-2 ${
              current === f
                ? "border-stone-700 bg-white"
                : "border-stone-300 hover:bg-white/70"
            }`}
          >
            <span
              aria-hidden
              className={`rounded-[2px] border-2 ${
                current === f ? "border-stone-700" : "border-stone-400"
              } ${f === "portrait" ? "h-6 w-4" : f === "square" ? "h-5 w-5" : "h-4 w-6"}`}
            />
            <span className="text-xs">{FRAME_LABELS[f]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

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

  if (spec.type === "VIDEO") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-stone-600">{spec.label}</span>
        <VideoUploader
          value={{
            videoUrl: value.videoUrl,
            imageUrl: value.imageUrl,
            thumbUrl: value.thumbUrl,
          }}
          onChange={(m, aspect) =>
            onChange({ ...value, ...m, aspect: aspect ?? value.aspect })
          }
        />
        <FormatPicker value={value} onChange={onChange} />
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Caption
          <input
            value={value.caption ?? ""}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            maxLength={300}
            className={inputCls}
          />
        </label>
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
        <LocationControl value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-stone-600">{spec.label}</span>
      <ImageUploader
        value={{ imageUrl: value.imageUrl, thumbUrl: value.thumbUrl }}
        onChange={(m, meta) => {
          let next = { ...value, ...m, aspect: meta?.aspect ?? value.aspect };
          // EXIF geotag fills the pin only if no manual pin exists (§7.5).
          if (meta?.lat != null && meta?.lng != null && value.locationSource !== "manual") {
            next = { ...next, lat: meta.lat, lng: meta.lng, locationSource: "exif" };
          }
          onChange(next);
        }}
      />
      <FormatPicker value={value} onChange={onChange} />
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
      <LocationControl value={value} onChange={onChange} />
    </div>
  );
}

function LocationControl({
  value,
  onChange,
}: {
  value: SlotData;
  onChange: (v: SlotData) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const hasLoc = value.lat != null && value.lng != null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-stone-200 bg-white/60 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
        <span className="font-medium">📍 Lokasi</span>
        {hasLoc ? (
          <>
            <span className="text-stone-500">
              {value.locationLabel ||
                `${value.lat!.toFixed(4)}, ${value.lng!.toFixed(4)}`}{" "}
              {value.locationSource === "exif" ? "(dari foto)" : "(manual)"}
            </span>
            <button
              type="button"
              onClick={() => setShowPicker((s) => !s)}
              className="rounded-md border border-stone-300 px-2 py-1 transition hover:bg-white"
            >
              {showPicker ? "Tutup peta" : "Ubah"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false);
                onChange({
                  ...value,
                  lat: null,
                  lng: null,
                  locationLabel: null,
                  locationSource: null,
                });
              }}
              className="rounded-md px-2 py-1 text-rose-700 transition hover:bg-rose-50"
            >
              Hapus lokasi
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className="rounded-md border border-stone-300 px-2 py-1 transition hover:bg-white"
          >
            {showPicker ? "Tutup peta" : "Set lokasi manual"}
          </button>
        )}
      </div>
      {showPicker && (
        <>
          <LocationPicker
            lat={value.lat}
            lng={value.lng}
            onPick={(lat, lng) =>
              onChange({ ...value, lat, lng, locationSource: "manual" })
            }
          />
          <p className="text-xs text-stone-400">
            Klik peta untuk menaruh pin, seret pin untuk menggeser. Tersimpan saat
            &ldquo;Simpan halaman&rdquo;.
          </p>
        </>
      )}
      {hasLoc && (
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Nama lokasi (mis. Bandung)
          <input
            value={value.locationLabel ?? ""}
            onChange={(e) => onChange({ ...value, locationLabel: e.target.value })}
            maxLength={120}
            className={inputCls}
          />
        </label>
      )}
    </div>
  );
}
