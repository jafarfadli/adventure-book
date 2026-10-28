"use client";

import { useEffect, useRef } from "react";

// In-place typing for captions and notes: same font, size, colour and box as
// the rendered text, so what you type is exactly what readers will see.

export function InlineInput({
  value,
  onChange,
  onDone,
  className,
  style,
  maxLength = 300,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  className?: string;
  style?: React.CSSProperties;
  maxLength?: number;
  label: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <input
      ref={ref}
      aria-label={label}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          onDone();
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className={`block w-full border-0 bg-transparent p-0 outline-none ${className ?? ""}`}
      style={{ caretColor: "currentColor", ...style }}
    />
  );
}

export function InlineArea({
  value,
  onChange,
  onDone,
  className,
  style,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  className?: string;
  style?: React.CSSProperties;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <textarea
      ref={ref}
      aria-label={label}
      value={value}
      maxLength={5000}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onDone();
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className={`block h-full w-full resize-none border-0 bg-transparent p-0 outline-none ${className ?? ""}`}
      style={{ caretColor: "currentColor", ...style }}
    />
  );
}
