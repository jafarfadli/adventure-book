"use client";

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

export type BookMetaDraft = { title: string; subtitle: string };

/**
 * Controlled: the single save button in the editor header writes this along
 * with every page, so this form owns no action of its own.
 */
export function MetaEditor({
  value,
  onChange,
}: {
  value: BookMetaDraft;
  onChange: (v: BookMetaDraft) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white/70 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Info buku
      </h2>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Judul
        <input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          required
          maxLength={120}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Subjudul
        <input
          value={value.subtitle}
          onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
          maxLength={200}
          className={inputCls}
        />
      </label>
    </div>
  );
}
