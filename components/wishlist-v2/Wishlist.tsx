"use client";

import Link from "next/link";
import { useState } from "react";
import { addWishV2, deleteWishV2, setWishDoneV2 } from "@/actions/v2/shelf";
import { Icon, IconButton } from "@/components/v2/Icon";
import { GRAIN_URL } from "@/components/world/art/defs";
import { stampParts } from "@/lib/v2/dates";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";

export type Wish = { id: string; text: string; done: boolean; doneAt: string | null };

// The shared wishlist on lined paper: hand-drawn boxes, a pen stroke through
// what is done, a small date of when. Visitors read it; the couple can add,
// tick and remove (with undo for the last removal).

function Box({ done }: { done: boolean }) {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
      <path d="M4 5 C9 4 19 3.5 24 4.5 C24.5 10 24.8 18 23.6 24 C17 24.6 10 24.8 4.4 23.8 C3.6 17 3.5 10 4 5Z" fill="#fffdf8" stroke="var(--c4)" strokeWidth="1.8" strokeLinejoin="round" />
      {done && <path d="M7.5 14.5 C10 17 11.5 19 12.5 20.5 C15.5 14 18.5 9.5 23 5.5" fill="none" stroke="var(--c3)" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

export function Wishlist({
  items: initial,
  canEdit,
  theme,
  backHref,
}: {
  items: Wish[];
  canEdit: boolean;
  theme: ThemeKey;
  backHref: string;
}) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [lastRemoved, setLastRemoved] = useState<{ item: Wish; index: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const t = THEMES[theme];

  async function guard(task: () => Promise<unknown>, rollback: () => void) {
    try {
      setFailed(false);
      await task();
    } catch {
      rollback();
      setFailed(true);
    }
  }

  function toggle(w: Wish) {
    const done = !w.done;
    const doneAt = done ? new Date().toISOString() : null;
    setItems((xs) => xs.map((x) => (x.id === w.id ? { ...x, done, doneAt } : x)));
    void guard(
      () => setWishDoneV2(w.id, done),
      () => setItems((xs) => xs.map((x) => (x.id === w.id ? w : x))),
    );
  }

  function remove(w: Wish) {
    const index = items.findIndex((x) => x.id === w.id);
    setItems((xs) => xs.filter((x) => x.id !== w.id));
    setLastRemoved({ item: w, index });
    void guard(
      () => deleteWishV2(w.id),
      () => setItems((xs) => [...xs.slice(0, index), w, ...xs.slice(index)]),
    );
  }

  async function add(value: string, done = false) {
    const v = value.trim();
    if (!v) return;
    setText("");
    await guard(
      async () => {
        const created = await addWishV2(v);
        if (done) await setWishDoneV2(created.id, true);
        setItems((xs) => [...xs, done ? { ...created, done, doneAt: new Date().toISOString() } : created]);
      },
      () => setText(v),
    );
  }

  return (
    <main className="relative grid min-h-dvh flex-1 place-items-center px-4 py-16" style={{ background: t.sky, ...(themeCssVars(t) as React.CSSProperties) }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.3 }} />
      <Link
        href={backHref}
        aria-label="Kembali"
        title="Kembali"
        className="fixed top-3 left-3 z-20 inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)]"
      >
        <Icon name="chevron-left" />
      </Link>

      <section
        aria-label="Wishlist"
        className="relative w-full max-w-md -rotate-1 rounded-sm px-6 pt-12 pb-8 shadow-[2px_8px_18px_rgba(30,16,20,0.28)]"
        style={{
          backgroundColor: "#fffdf8",
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 47px, var(--c1) 47px 48px)",
          backgroundPosition: "0 38px",
        }}
      >
        <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-2 opacity-90" style={{ background: "var(--c2)" }} />
        <span aria-hidden className="absolute top-3 left-5" style={{ color: "var(--accent)" }}>
          <Icon name="spark" className="h-6 w-6" />
        </span>

        {items.length === 0 && !canEdit && (
          <p className="py-6 text-center font-hand text-2xl" style={{ color: "var(--c4)" }}>
            <Icon name="spark" className="mx-auto h-8 w-8" />
          </p>
        )}

        <ul className="flex flex-col">
          {items.map((w) => (
            <li key={w.id} className="flex min-h-12 items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(w)}
                disabled={!canEdit}
                aria-pressed={w.done}
                aria-label={w.done ? `Belum: ${w.text}` : `Sudah: ${w.text}`}
                title={w.done ? "Tandai belum" : "Tandai sudah"}
                className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-[#2b2326] disabled:cursor-default"
              >
                <Box done={w.done} />
              </button>
              <span className="min-w-0 flex-1">
                {/* the pen stroke spans exactly the words */}
                <span className="relative inline-block max-w-full">
                  <span className={`font-hand text-2xl leading-tight ${w.done ? "opacity-50" : ""}`} style={{ color: "var(--ink)" }}>
                    {w.text}
                  </span>
                  {w.done && (
                    <svg aria-hidden className="pointer-events-none absolute -inset-x-1 top-1/2 h-3 w-[calc(100%+0.5rem)] -translate-y-1/2" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M1 6 C 25 3, 50 7, 75 4 S 95 5, 99 4" fill="none" stroke="var(--c3)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                </span>
              </span>
              {w.done && w.doneAt && (
                <span className="shrink-0 font-hand text-base" style={{ color: "var(--c3)" }}>
                  {stampParts(new Date(w.doneAt)).day}
                </span>
              )}
              {canEdit && <IconButton icon="trash" label={`Hapus: ${w.text}`} size="sm" variant="ghost" onClick={() => remove(w)} />}
            </li>
          ))}
        </ul>

        {canEdit && (
          <form
            className="mt-2 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void add(text);
            }}
          >
            <input
              aria-label="Wish baru"
              placeholder="…"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              className="h-12 min-w-0 flex-1 border-0 border-b-2 border-dashed bg-transparent font-hand text-2xl outline-none focus-visible:border-solid"
              style={{ borderColor: "var(--c2)", color: "var(--ink)" }}
            />
            <IconButton icon="plus" label="Tambah wish" type="submit" variant="primary" disabled={!text.trim()} />
          </form>
        )}

        {(lastRemoved || failed) && canEdit && (
          <div className="mt-4 flex items-center justify-end gap-2">
            {failed && <Icon name="warning" className="h-5 w-5 text-[#a3324f]" title="Gagal menyimpan" />}
            {lastRemoved && (
              <IconButton
                icon="undo"
                label="Urungkan hapus"
                size="sm"
                onClick={async () => {
                  const r = lastRemoved;
                  setLastRemoved(null);
                  await add(r.item.text, r.item.done);
                }}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
