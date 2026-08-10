export default function EditorLoading() {
  return (
    <main className="min-h-dvh flex-1 bg-stone-100">
      <div className="mx-auto flex max-w-2xl animate-pulse flex-col gap-6 p-4 py-8 md:p-8">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 rounded bg-stone-200" />
          <div className="h-9 w-40 rounded-md bg-stone-200" />
        </div>
        <div className="h-64 rounded-lg bg-white/70 shadow-sm" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 rounded bg-stone-200" />
          <div className="h-12 rounded-lg bg-white/70 shadow-sm" />
          <div className="h-12 rounded-lg bg-white/70 shadow-sm" />
          <div className="h-12 rounded-lg bg-white/70 shadow-sm" />
        </div>
      </div>
    </main>
  );
}
