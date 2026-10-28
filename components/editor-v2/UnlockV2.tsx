"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, IconButton } from "@/components/v2/Icon";
import { withBase } from "@/lib/basePath";
import { THEMES, type ThemeKey } from "@/lib/v2/themes";

/** Password on a paper card; the check opens the editor. */
export function UnlockV2({ slug, theme, next }: { slug: string; theme: ThemeKey; next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = THEMES[theme];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBase("/api/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Coba lagi, ya.");
    } catch {
      setError("Coba lagi, ya.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh flex-1 place-items-center p-6" style={{ background: t.sky }}>
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm -rotate-1 flex-col gap-4 rounded-2xl bg-[#fffaf2] p-6 shadow-[2px_6px_14px_rgba(30,16,20,0.28)]"
      >
        <div className="flex items-center gap-3 text-[#2b2326]">
          <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ background: t.c3 }}>
            <Icon name="pencil" />
          </span>
          <input
            type="password"
            aria-label="Password buku"
            placeholder="••••••"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#e7dfe2] bg-white px-3 text-lg focus-visible:outline-2 focus-visible:outline-[#2b2326]"
          />
          <IconButton icon={busy ? "spinner" : "check"} label="Buka mode edit" type="submit" variant="primary" disabled={busy || !password} />
        </div>
        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#a3324f]">
            <Icon name="warning" className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
