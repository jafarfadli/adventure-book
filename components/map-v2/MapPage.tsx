"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/v2/Icon";
import { useReducedMotion } from "@/components/world/hooks";
import { THEMES, type ThemeKey } from "@/lib/v2/themes";
import type { MapPin } from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-dvh w-full animate-pulse bg-[#efe8eb]" />,
});

const chip =
  "inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)] focus-visible:outline-2 focus-visible:outline-[#2b2326]";

/** Every geotagged photo and video of every book; one colour dot per book to filter. */
export function MapPage({
  pins,
  books,
  backHref,
}: {
  pins: MapPin[];
  books: { title: string; theme: ThemeKey }[];
  backHref: string;
}) {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const shown = useMemo(() => pins.filter((p) => !hidden.has(p.book)), [pins, hidden]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {pins.length > 0 ? (
        <MapView pins={shown} reduceMotion={reduce} />
      ) : (
        <div className="grid h-dvh place-items-center bg-[#f8d9df] p-6">
          <div className="flex -rotate-1 flex-col items-center gap-3 rounded-2xl bg-[#fffaf2] px-8 py-6 text-[#a5436a] shadow-[2px_6px_14px_rgba(30,16,20,0.25)]">
            <Icon name="pin" className="h-10 w-10" />
            <p className="font-hand text-2xl font-bold">Belum ada foto berlokasi</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex items-start justify-between [&>*]:pointer-events-auto">
        <Link href={backHref} aria-label="Kembali" title="Kembali" className={chip}>
          <Icon name="chevron-left" />
        </Link>
        {books.length > 1 && (
          <div className="flex gap-2 rounded-full bg-[#fffaf5]/95 p-1.5 shadow-[0_2px_8px_rgba(40,10,30,0.2)]">
            {books.map((b, i) => (
              <button
                key={i}
                type="button"
                aria-label={b.title}
                title={b.title}
                aria-pressed={!hidden.has(i)}
                onClick={() => {
                  const next = new Set(hidden);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  setHidden(next);
                }}
                className="h-7 w-7 rounded-full transition"
                style={{ background: THEMES[b.theme].c3, opacity: hidden.has(i) ? 0.3 : 1 }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
