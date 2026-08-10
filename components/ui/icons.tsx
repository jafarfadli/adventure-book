// Tiny inline SVG icons. Unicode glyphs like ✎ or ↗ silently switch to emoji
// presentation on iOS — SVGs render identically everywhere.

type IconProps = { className?: string };

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconMapPin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function IconShare({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function IconMusic({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function IconMusicOff({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <path d="M9 18V7" />
      <path d="M15 4.5 21 3v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function IconPencil({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
