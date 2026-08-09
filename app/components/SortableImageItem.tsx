"use client";

import { CSSProperties } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, DragDropIcon } from "@hugeicons-pro/core-solid-rounded";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableImageItemProps {
  id: string;
  src: string;
  onRemove: (id: string) => void;
}

export function SortableImageItem({ id, src, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-[var(--radius-md)] overflow-hidden group border border-[var(--border)] bg-[var(--input)]
        ${isDragging ? "shadow-lg ring-2 ring-[var(--primary)] scale-105" : ""}`}
    >
      <img src={src} alt="Uploaded" className="w-full h-full object-cover pointer-events-none" />
      
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-[var(--background)]/80 rounded-[var(--radius-sm)] text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
      >
        <HugeiconsIcon icon={DragDropIcon} size={18} />
      </div>

      <button
        onClick={() => onRemove(id)}
        className="absolute top-1 right-1 p-1 bg-[var(--danger)] rounded-full text-[var(--primary-foreground)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hover:brightness-110"
      >
        <HugeiconsIcon icon={Delete01Icon} size={18} />
      </button>
    </div>
  );
}
