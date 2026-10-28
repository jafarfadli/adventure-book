import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorldDefs } from "@/components/world/art/defs";
import { StationScene } from "@/components/world/StationScene";
import { prisma } from "@/lib/db";
import { pageSelect, toPageV2 } from "@/lib/v2/load";
import { TEMPLATE_KEYS, TEMPLATES, slotSpecs, type TemplateKey } from "@/lib/v2/templates";
import { THEME_KEYS, THEMES, isThemeKey, type ThemeKey } from "@/lib/v2/themes";
import { emptySlot, type PageV2, type SlotV2 } from "@/lib/v2/types";

// Development-only: every template in every theme, using the book's real
// pages where one exists and borrowing its photos for the rest. 404 in
// production builds.

export const metadata: Metadata = { title: "Galeri template — dev" };

type Props = { searchParams: Promise<{ theme?: string; t?: string }> };

const STORY =
  "Hari ini kita makan di Kopi Nako, terus jalan pelan-pelan pulang. Bahagia itu sederhana ♡";

function synthesize(template: TemplateKey, donors: SlotV2[], theme: ThemeKey, n: number): PageV2 {
  const slots: Record<string, SlotV2> = {};
  let i = n;
  for (const spec of slotSpecs(template)) {
    if (spec.type === "TEXT") {
      slots[spec.key] = { ...emptySlot("text1", "TEXT"), text: template === "quote" ? "bahagia itu sederhana" : STORY };
    } else {
      const want = spec.type === "VIDEO" ? "VIDEO" : "PHOTO";
      const pool = donors.filter((d) => d.type === want);
      const donor = pool[i++ % Math.max(pool.length, 1)];
      slots[spec.key] = donor ? { ...donor, key: spec.key } : emptySlot(spec.key, spec.type);
    }
  }
  return { id: `sample-${template}`, order: n, template, theme, ownTheme: theme, decorSeed: 0, slots };
}

export default async function GalleryPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const themes: ThemeKey[] = isThemeKey(sp.theme) ? [sp.theme] : ["stroberi"];
  const only = TEMPLATE_KEYS.find((k) => k === sp.t);

  const book = await prisma.book.findUnique({
    where: { slug: process.env.DEFAULT_SLUG ?? "our-story" },
    select: { theme: true, pages: { orderBy: { order: "asc" }, select: pageSelect } },
  });
  const real = (book?.pages ?? []).map((p) => toPageV2(p, book!.theme)).filter((p): p is PageV2 => p !== null);
  const donors = real.flatMap((p) => Object.values(p.slots)).filter((s) => s.imageUrl);

  const shownThemes = only ? THEME_KEYS : themes;
  const shownTemplates = only ? [only] : TEMPLATE_KEYS;

  return (
    <main className="min-h-dvh bg-[#f4eff1] p-6 text-[#2b2326]">
      <WorldDefs />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {THEME_KEYS.map((k) => (
          <Link
            key={k}
            href={`/dev/gallery?theme=${k}`}
            className={`rounded-full px-3 py-1.5 ${themes.includes(k) && !only ? "bg-[#2b2326] text-white" : "bg-white"}`}
          >
            {THEMES[k].label}
          </Link>
        ))}
      </nav>
      {shownThemes.map((theme) => (
        <section key={theme} className="mb-10" data-theme-section={theme}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#665b60]">{THEMES[theme].label}</h2>
          <div className="flex flex-wrap gap-5">
            {shownTemplates.map((key, n) => {
              const found = real.find((p) => p.template === key);
              const page = found ? { ...found, theme } : synthesize(key, donors, theme, n);
              return (
                <figure key={key} className="m-0" data-template={key}>
                  <StationScene page={page} height={330} className="rounded-md shadow-md" />
                  <figcaption className="mt-1.5 text-xs text-[#665b60]">
                    {TEMPLATES[key].label} {found ? "" : "· contoh"}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
