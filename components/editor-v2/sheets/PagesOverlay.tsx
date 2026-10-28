"use client";

import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton } from "@/components/v2/Icon";
import type { PageV2 } from "@/lib/v2/types";
import { StationScene } from "@/components/world/StationScene";

// Every stop as a tile — rendered by the same StationScene as the book, so
// what you rearrange is exactly what readers see. Long-press (touch) or drag
// (mouse) to move; tap to jump there.

function Tile({ page, n, onJump }: { page: PageV2; n: number; onJump: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative cursor-grab touch-manipulation select-none ${isDragging ? "z-10 scale-105 rotate-2 shadow-2xl" : ""}`}
      onClick={() => onJump(page.id)}
      aria-label={`Halaman ${n}`}
      role="button"
    >
      <StationScene page={page} height={190} lowRes className="rounded-xl shadow-md" />
      <span className="absolute top-2 left-2 grid h-7 min-w-7 place-items-center rounded-full bg-[#2b2326] px-2 text-xs font-semibold text-white">{n}</span>
    </div>
  );
}

export function PagesOverlay({
  pages,
  onReorder,
  onJump,
  onClose,
}: {
  pages: PageV2[];
  onReorder: (ids: string[]) => void;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = pages.map((p) => p.id);
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f1ebee]" role="dialog" aria-modal="true" aria-label="Semua halaman">
      <div className="sticky top-0 z-20 flex justify-end bg-[#f1ebee]/90 p-3 backdrop-blur">
        <IconButton icon="zoom-in" label="Kembali ke buku" onClick={onClose} />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap justify-center gap-3 px-3 pb-10">
            {pages.map((p, i) => (
              <Tile key={p.id} page={p} n={i + 1} onJump={onJump} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
