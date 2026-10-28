"use client";

import { IconButton, type IconName } from "@/components/v2/Icon";

export type DockItem = { icon: IconName; label: string; onClick: () => void; swatch?: string; danger?: boolean };

/** The one bar of actions for whatever is selected, centred at the bottom. */
export function Dock({ items }: { items: DockItem[] }) {
  if (items.length === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label="Aksi"
      className="pointer-events-auto absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-[#fffaf5]/97 p-1 shadow-[0_3px_12px_rgba(40,10,30,0.25)]"
    >
      {items.map((it) =>
        it.swatch ? (
          <button
            key={it.label}
            type="button"
            aria-label={it.label}
            title={it.label}
            onClick={it.onClick}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#2b2326]"
          >
            <span className="h-[18px] w-[18px] rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(0,0,0,0.18)]" style={{ background: it.swatch }} />
          </button>
        ) : (
          <IconButton key={it.label} icon={it.icon} label={it.label} onClick={it.onClick} variant="ghost" className={it.danger ? "text-[#a3324f]" : ""} />
        ),
      )}
    </div>
  );
}
