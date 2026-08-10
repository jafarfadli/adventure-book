export default function ReaderLoading() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-[#e3d5bc] p-4 md:p-8">
      <div className="w-full max-w-5xl animate-pulse">
        <div className="grid overflow-hidden rounded-sm shadow-2xl shadow-black/30 md:grid-cols-2">
          <div className="flex min-h-[70dvh] items-center justify-center bg-[#f5eddb]">
            <div className="h-56 w-52 -rotate-2 bg-white/70 shadow-lg" />
          </div>
          <div className="hidden bg-[#f0e7d2] md:block" />
        </div>
      </div>
      <div className="h-11 w-44 animate-pulse rounded-full bg-white/40" />
    </main>
  );
}
