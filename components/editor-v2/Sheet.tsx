"use client";

import { useEffect } from "react";

/**
 * Bottom sheet over the book: full width on phones, a centred card on wide
 * screens. Closes on the backdrop, the grab bar, or Escape.
 */
export function Sheet({
  label,
  onClose,
  children,
  wide = false,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-[#1e141a]/35" onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] overflow-y-auto rounded-t-[22px] bg-[#fffaf5] px-5 pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))] text-[#2b2326] shadow-[0_-8px_24px_rgba(0,0,0,0.16)] ${
          wide ? "max-w-3xl" : "max-w-xl"
        } sm:bottom-4 sm:rounded-[22px]`}
      >
        <button type="button" aria-label="Tutup" onClick={onClose} className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-[#ddd2d6]" />
        {children}
      </div>
    </div>
  );
}
