"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { IconButton } from "@/components/v2/Icon";
import type { SlotPatch } from "@/lib/v2/edit";
import type { SlotV2 } from "@/lib/v2/types";

// Leaflet touches window at import time — client-only.
const PinPicker = dynamic(() => import("./PinPicker"), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-[#efe8eb]" />,
});

/** Drop or drag a pin; an optional place name; save or clear. */
export function LocationPanel({ slot, onSave, onClose }: { slot: SlotV2; onSave: (p: SlotPatch) => void; onClose: () => void }) {
  const [pos, setPos] = useState<{ lat: number | null; lng: number | null }>({ lat: slot.lat, lng: slot.lng });
  const [label, setLabel] = useState(slot.locationLabel ?? "");
  const has = pos.lat != null && pos.lng != null;
  return (
    <div className="flex flex-col gap-3">
      <PinPicker lat={pos.lat} lng={pos.lng} onPick={(lat, lng) => setPos({ lat, lng })} />
      <input
        aria-label="Nama tempat"
        placeholder="Nama tempat"
        value={label}
        maxLength={120}
        onChange={(e) => setLabel(e.target.value)}
        className="h-12 rounded-xl border border-[#e7dfe2] bg-white px-3 font-hand text-xl font-bold focus-visible:outline-2 focus-visible:outline-[#2b2326]"
      />
      <div className="flex items-center justify-between">
        <IconButton
          icon="trash"
          label="Hapus lokasi"
          variant="ghost"
          onClick={() => {
            onSave({ lat: null, lng: null, locationLabel: null, locationSource: null });
            onClose();
          }}
        />
        <IconButton
          icon="check"
          label="Simpan lokasi"
          variant="primary"
          disabled={!has}
          onClick={() => {
            onSave({ lat: pos.lat, lng: pos.lng, locationLabel: label.trim() || null, locationSource: "manual" });
            onClose();
          }}
        />
      </div>
    </div>
  );
}
