// v2 icon set: one 24×24 grid, 2px round strokes, currentColor. Drawn for the
// book (no emoji anywhere in the UI). Icon-only controls go through
// IconButton, which always carries an aria-label and a tooltip.

export type IconName =
  | "check"
  | "undo"
  | "grid"
  | "book"
  | "plus"
  | "photos"
  | "swap"
  | "focus"
  | "calendar"
  | "pin"
  | "trash"
  | "layout"
  | "dice"
  | "map"
  | "spark"
  | "share"
  | "music"
  | "music-off"
  | "pencil"
  | "zoom-in"
  | "drag"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "play"
  | "arrow-right"
  | "shelf"
  | "warning"
  | "spinner"
  | "cloud-check"
  | "film"
  | "text"
  | "eye-off";

const dot = (cx: number, cy: number) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.2} fill="currentColor" stroke="none" />;

const PATHS: Record<IconName, React.ReactNode> = {
  check: <path d="M5 12.5 L10 17 L19 7" />,
  undo: (
    <>
      <path d="M9 5 L4 10 L9 15" />
      <path d="M4 10 H14.5 A5 5 0 0 1 14.5 20 H11" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  book: (
    <>
      <path d="M6 4 H18 V20 H8 A2 2 0 0 1 6 18 Z" />
      <path d="M6 18 A2 2 0 0 1 8 16 H18" />
      <path d="M10 8 H15" />
    </>
  ),
  plus: <path d="M12 5 V19 M5 12 H19" />,
  photos: (
    <>
      <rect x="3" y="6" width="14" height="13" rx="2" />
      <path d="M7 3 H19 A2 2 0 0 1 21 5 V16" />
      <path d="M3 16 L7.5 12 L11 15 L13.5 13 L17 16" />
    </>
  ),
  swap: (
    <>
      <path d="M4.5 10 A8 8 0 0 1 18.5 7" />
      <path d="M19 3 V7.5 H14.5" />
      <path d="M19.5 14 A8 8 0 0 1 5.5 17" />
      <path d="M5 21 V16.5 H9.5" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3 V6.5 M12 17.5 V21 M3 12 H6.5 M17.5 12 H21" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2.5" />
      <path d="M4 10.5 H20 M8.5 3.5 V7.5 M15.5 3.5 V7.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21 C12 21 5.5 14.8 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 14.8 12 21 12 21 Z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </>
  ),
  trash: <path d="M5 7 H19 M10 7 V4.5 H14 V7 M7 7 L8 20 H16 L17 7" />,
  layout: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M12 4 V20 M12 12 H20" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      {[dot(9, 9), dot(15, 9), dot(12, 12), dot(9, 15), dot(15, 15)]}
    </>
  ),
  map: <path d="M4 6.5 L9 4.5 L15 6.5 L20 4.5 V17.5 L15 19.5 L9 17.5 L4 19.5 Z M9 4.5 V17.5 M15 6.5 V19.5" />,
  spark: <path d="M12 3.5 Q13 11 20.5 12 Q13 13 12 20.5 Q11 13 3.5 12 Q11 11 12 3.5 Z" />,
  share: <path d="M12 14.5 V4 M8 8 L12 4 L16 8 M6 11.5 V19 H18 V11.5" />,
  music: (
    <>
      <path d="M9 18 V6 L19 4 V16" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </>
  ),
  "music-off": (
    <>
      <path d="M9 18 V6 L19 4 V16" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
      <path d="M4 4 L20 20" />
    </>
  ),
  pencil: <path d="M5 19 L6 15 L15.5 5.5 L18.5 8.5 L9 18 Z M13.5 7.5 L16.5 10.5" />,
  "zoom-in": (
    <>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M8 4 H4 V7 M16 4 H20 V7 M8 20 H4 V17 M16 20 H20 V17" />
    </>
  ),
  drag: <>{[dot(9, 7), dot(15, 7), dot(9, 12), dot(15, 12), dot(9, 17), dot(15, 17)]}</>,
  close: <path d="M6 6 L18 18 M18 6 L6 18" />,
  "chevron-left": <path d="M15 5 L8 12 L15 19" />,
  "chevron-right": <path d="M9 5 L16 12 L9 19" />,
  play: <path d="M8 5 L19 12 L8 19 Z" fill="currentColor" />,
  "arrow-right": <path d="M4 12 H19 M13 6 L19 12 L13 18" />,
  shelf: (
    <>
      <path d="M3 20 H21" />
      <path d="M5 20 V8 H8 V20 M9.5 20 V5 H12.5 V20 M14.5 20 L16 9 L19 9.6 L17.6 20" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 L21 19 H3 Z" />
      <path d="M12 10 V14" />
      {dot(12, 16.6)}
    </>
  ),
  spinner: <path d="M12 4 A8 8 0 1 1 4.6 9" />,
  "cloud-check": (
    <>
      <path d="M7 18 A4 4 0 0 1 6.5 10 A5.5 5.5 0 0 1 17 9 A4 4 0 0 1 17.5 18 Z" />
      <path d="M9.5 13.5 L11.5 15.5 L15 12" />
    </>
  ),
  film: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 3 V21 M16 3 V21 M4 8 H8 M4 16 H8 M16 8 H20 M16 16 H20" />
    </>
  ),
  text: <path d="M6 6 H18 M12 6 V19" />,
  "eye-off": (
    <>
      <path d="M3 12 C6 7 18 7 21 12 C18 17 6 17 3 12 Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4 L20 20" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  title,
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${name === "spinner" ? "animate-spin " : ""}${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}

type Variant = "plain" | "primary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  plain: "bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)] hover:bg-white",
  primary: "bg-[#2b2326] text-white shadow-[0_2px_8px_rgba(40,10,30,0.25)] hover:bg-[#3a3034]",
  ghost: "bg-transparent text-[#2b2326] hover:bg-black/5",
};

export function IconButton({
  icon,
  label,
  onClick,
  variant = "plain",
  pressed,
  disabled,
  className = "",
  size = "md",
  type = "button",
}: {
  icon: IconName;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
}) {
  const box = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const glyph = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={`inline-grid shrink-0 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2326] disabled:opacity-40 ${box} ${VARIANTS[variant]} ${pressed ? "ring-2 ring-[#2b2326]" : ""} ${className}`}
    >
      <Icon name={icon} className={glyph} />
    </button>
  );
}
