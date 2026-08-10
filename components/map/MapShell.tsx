"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MusicToggle } from "@/components/reader/MusicToggle";
import type { MapMarkerData } from "./MapView";

// Leaflet is browser-only; skip SSR entirely.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-[#e3d5bc]">
      <p className="font-hand text-2xl text-stone-500">Membuka peta…</p>
    </div>
  ),
});

export function MapShell({
  markers,
  slug,
  title,
}: {
  markers: MapMarkerData[];
  slug: string;
  title: string;
}) {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapView markers={markers} slug={slug} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-center justify-between p-4">
        <Link
          href={`/book/${slug}`}
          className="pointer-events-auto rounded-full bg-white/90 px-4 py-2 text-sm text-stone-700 shadow-md transition hover:bg-white"
        >
          ← Kembali ke buku
        </Link>
        <h1 className="pointer-events-auto rounded-full bg-white/90 px-4 py-2 font-hand text-xl text-stone-700 shadow-md">
          🗺️ Peta kenangan — {title}
        </h1>
      </div>
      <MusicToggle className="fixed bottom-4 left-4 z-[500] rounded-full bg-white/90 px-4 py-2 !opacity-100 text-stone-700 shadow-md" />
    </main>
  );
}
