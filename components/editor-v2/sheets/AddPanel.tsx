"use client";

import { useRef, useState } from "react";
import type { PageDraft } from "@/actions/v2/editor";
import { Icon } from "@/components/v2/Icon";
import { groupUploads, type DayGroup, type Uploaded } from "@/lib/v2/bulk";
import { stampParts } from "@/lib/v2/dates";
import { TEMPLATES, type TemplateKey } from "@/lib/v2/templates";
import { THEME_KEYS, THEMES, type ThemeKey } from "@/lib/v2/themes";
import { Glyph } from "../Glyph";
import { isVideoFile, uploadMedia } from "../upload";
import { TemplateGrid } from "./Pickers";

// Add stops at one place on the path: either an empty stop from a template,
// or many photos/videos at once — uploaded, grouped by day, shaped into
// stops, reviewed, then created together.

type Item = { key: string; file: File; preview: string; state: "uploading" | "done" | "failed"; up?: Uploaded; excluded?: boolean };

const ALTERNATIVES: Record<string, TemplateKey[]> = {
  "photo-1": ["single-tall", "single-wide"],
  "photo-2": ["duo-side", "duo-stack", "duo-text"],
  "photo-3": ["trio", "strip-text"],
  "video-1": ["video-tall", "video-wide"],
};

function draftFor(template: TemplateKey, theme: ThemeKey | null, items: Uploaded[]): PageDraft {
  const slots: PageDraft["slots"] = {};
  TEMPLATES[template].frames.forEach((f, i) => {
    const u = items[i];
    if (!u) return;
    slots[f.key] = {
      imageUrl: u.imageUrl,
      thumbUrl: u.thumbUrl,
      ...(u.videoUrl ? { videoUrl: u.videoUrl } : {}),
      width: u.width,
      height: u.height,
      takenAt: u.takenAt,
      ...(u.lat != null && u.lng != null ? { lat: u.lat, lng: u.lng, locationSource: "exif" as const } : {}),
    };
  });
  return { template, theme, slots };
}

export function AddPanel({
  onEmpty,
  onCreate,
}: {
  onEmpty: (t: TemplateKey) => void;
  onCreate: (drafts: PageDraft[]) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [plan, setPlan] = useState<{ template: TemplateKey; theme: ThemeKey | null; ids: string[] }[] | null>(null);
  const [days, setDays] = useState<(string | null)[]>([]);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list: Item[] = Array.from(files).map((file, i) => ({ key: `${Date.now()}-${i}`, file, preview: URL.createObjectURL(file), state: "uploading" }));
    setItems(list);
    // two at a time: quick on photos, kind to the Mac mini on videos
    const results = [...list];
    let next = 0;
    async function worker() {
      while (next < list.length) {
        const i = next++;
        const it = list[i];
        try {
          const r = await uploadMedia(it.file);
          results[i] = {
            ...it,
            state: "done",
            up: {
              id: it.key,
              kind: isVideoFile(it.file) ? "video" : "photo",
              width: r.width ?? null,
              height: r.height ?? null,
              takenAt: r.takenAt ?? null,
              imageUrl: r.imageUrl,
              thumbUrl: r.thumbUrl ?? null,
              videoUrl: r.videoUrl ?? null,
              lat: r.lat ?? null,
              lng: r.lng ?? null,
            },
          };
        } catch {
          results[i] = { ...it, state: "failed" };
        }
        setItems([...results]);
      }
    }
    await Promise.all([worker(), worker()]);
    regroup(results);
  }

  function regroup(all: Item[]) {
    const ups = all.filter((i) => i.state === "done" && !i.excluded).map((i) => i.up!);
    const groups: DayGroup[] = groupUploads(ups);
    setDays(groups.flatMap((g) => g.stops.map(() => g.day)));
    setPlan(groups.flatMap((g) => g.stops.map((s) => ({ template: s.template, theme: null, ids: s.items.map((u) => u.id) }))));
  }

  const byId = new Map(items.map((i) => [i.key, i]));
  const uploading = items.some((i) => i.state === "uploading");

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label="Tambah foto atau video"
          title="Tambah foto atau video"
          className="flex h-24 items-center justify-center gap-3 rounded-2xl bg-[#2b2326] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2326]"
        >
          <Icon name="photos" className="h-8 w-8" />
          <Icon name="plus" className="h-6 w-6" />
        </button>
        <input ref={input} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => void pick(e.target.files)} />
        <TemplateGrid onPick={onEmpty} />
      </div>
    );
  }

  if (uploading || !plan) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {items.map((it) => (
          <div key={it.key} className="relative aspect-square overflow-hidden rounded-xl bg-[#efe8eb]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {!isVideoFile(it.file) && <img src={it.preview} alt="" className="h-full w-full object-cover" />}
            <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
              {it.state === "uploading" && <Icon name="spinner" className="h-6 w-6" />}
              {it.state === "failed" && <Icon name="warning" className="h-6 w-6" title="Gagal diunggah" />}
              {it.state === "done" && isVideoFile(it.file) && <Icon name="film" className="h-6 w-6" />}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const kindKey = (ids: string[]) => {
    const kinds = ids.map((id) => byId.get(id)!.up!.kind);
    return kinds[0] === "video" ? "video-1" : `photo-${ids.length}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {plan.map((stop, i) => {
        const day = days[i];
        const showDay = i === 0 || days[i - 1] !== day;
        const alts = ALTERNATIVES[kindKey(stop.ids)] ?? [stop.template];
        return (
          <div key={i} className="rounded-2xl bg-white p-3 shadow-[0_1px_3px_rgba(40,10,30,0.08)]">
            {showDay && (
              <div className="mb-2 font-hand text-xl font-bold">
                {day ? stampParts(new Date(`${day}T12:00:00+07:00`)).day : "—"}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1.5 overflow-x-auto">
                {stop.ids.map((id) => {
                  const it = byId.get(id)!;
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={id} src={it.up!.thumbUrl ?? it.up!.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  );
                })}
              </div>
              <button
                type="button"
                aria-label={`Template: ${TEMPLATES[stop.template].label}`}
                title={TEMPLATES[stop.template].label}
                onClick={() =>
                  setPlan(plan.map((p, j) => (j === i ? { ...p, template: alts[(alts.indexOf(p.template) + 1) % alts.length] } : p)))
                }
                className="grid h-11 w-14 place-items-center rounded-xl bg-[#f4eef0] text-[#5f5257]"
              >
                <Glyph template={stop.template} className="h-6 w-9" />
              </button>
              <button
                type="button"
                aria-label={stop.theme ? `Tema ${THEMES[stop.theme].label}` : "Ikut tema buku"}
                title={stop.theme ? THEMES[stop.theme].label : "Ikut tema buku"}
                onClick={() => {
                  const order: (ThemeKey | null)[] = [null, ...THEME_KEYS];
                  setPlan(plan.map((p, j) => (j === i ? { ...p, theme: order[(order.indexOf(p.theme) + 1) % order.length] } : p)));
                }}
                className="h-9 w-9 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
                style={{ background: stop.theme ? THEMES[stop.theme].c3 : "repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)" }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={busy || plan.length === 0}
          onClick={async () => {
            setBusy(true);
            const drafts = plan.map((p) => draftFor(p.template, p.theme, p.ids.map((id) => byId.get(id)!.up!)));
            await onCreate(drafts);
            setBusy(false);
          }}
          aria-label={`Tambahkan ${plan.length} halaman`}
          title={`Tambahkan ${plan.length} halaman`}
          className="flex h-12 items-center gap-2 rounded-full bg-[#2b2326] px-6 text-lg font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Icon name="spinner" /> : <Icon name="check" />}
          <span>{plan.length}</span>
        </button>
      </div>
    </div>
  );
}
