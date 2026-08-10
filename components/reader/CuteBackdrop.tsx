// Decorative watercolor backdrop: soft pastel blobs, corner washi tapes,
// and tiny hand-drawn doodles. Purely visual — hidden from a11y tree.
export function CuteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* notebook dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(120,90,60,0.22)_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* watercolor blobs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-rose-300/45 blur-3xl" />
      <div className="absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="absolute -bottom-28 left-[16%] h-96 w-96 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="absolute right-1/4 -bottom-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="absolute top-6 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-300/35 blur-3xl" />

      {/* corner washi tapes */}
      <div className="absolute -left-10 top-8 h-7 w-44 -rotate-45 bg-rose-300/70 shadow-sm" />
      <div className="absolute -right-10 bottom-10 h-7 w-44 -rotate-45 bg-sky-300/60 shadow-sm" />
      <div className="absolute -right-12 top-16 hidden h-6 w-40 rotate-45 bg-emerald-200/60 shadow-sm md:block" />

      {/* doodles */}
      <span className="absolute left-[8%] top-[18%] hidden -rotate-12 font-hand text-4xl text-rose-400/70 sm:block">
        ♡
      </span>
      <span className="absolute right-[10%] top-[12%] rotate-12 font-hand text-2xl text-amber-500/60">
        ✦
      </span>
      <span className="absolute bottom-[14%] left-[13%] hidden -rotate-6 font-hand text-3xl text-sky-500/60 sm:block">
        ☁︎
      </span>
      <span className="absolute right-[13%] bottom-[20%] hidden rotate-6 font-hand text-3xl text-emerald-500/50 sm:block">
        ❀
      </span>
      <span className="absolute bottom-[8%] left-[45%] font-hand text-2xl text-purple-400/60">
        ⋆｡˚
      </span>
      <span className="absolute left-[78%] top-[38%] hidden rotate-12 font-hand text-2xl text-rose-400/50 md:block">
        ✈
      </span>
      <span className="absolute left-[4%] top-[55%] hidden -rotate-12 font-hand text-2xl text-amber-500/50 md:block">
        ✿
      </span>
      <span className="absolute right-[5%] top-[62%] hidden rotate-6 font-hand text-xl text-purple-400/60 md:block">
        xoxo
      </span>
      <span className="absolute left-[30%] top-[7%] hidden -rotate-6 font-hand text-xl text-emerald-500/50 md:block">
        ♪
      </span>
      <span className="absolute right-[30%] bottom-[6%] rotate-3 font-hand text-xl text-rose-400/60">
        ˚ ༘ ♡
      </span>

      {/* dashed hand-drawn frame around the screen */}
      <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-stone-500/15 md:inset-5" />
    </div>
  );
}
