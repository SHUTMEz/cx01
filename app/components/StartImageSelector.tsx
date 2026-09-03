"use client";

import { useState } from "react";
import { addStartImage } from "./startImageDrop";

interface StartImageSelectorProps {
  images: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function StartImageSelector({ images, selected, onChange }: StartImageSelectorProps) {
  const [droppedImages, setDroppedImages] = useState<string[]>([]);
  const availableImages = [...images, ...droppedImages.filter((image) => !images.includes(image))];
  const allSelected = availableImages.length > 0 && selected.length === availableImages.length;
  const toggle = (image: string) => onChange(selected.includes(image)
    ? selected.filter((item) => item !== image)
    : [...selected, image]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove("border-[var(--primary)]", "bg-[var(--primary)]/5");
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        const result = addStartImage(availableImages, selected, reader.result);
        setDroppedImages((current) => current.includes(reader.result as string) ? current : [...current, reader.result as string]);
        onChange(result.selected);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add("border-[var(--primary)]", "bg-[var(--primary)]/5"); }}
      onDragLeave={(event) => event.currentTarget.classList.remove("border-[var(--primary)]", "bg-[var(--primary)]/5")}
      onDrop={handleDrop}
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--input)] p-3 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--foreground)]">Start images</span>
        <button type="button" onClick={() => onChange(allSelected ? [] : availableImages)} className="min-h-9 px-2 text-[11px] text-[var(--primary)] font-semibold">
          {allSelected ? "Clear all" : "Use all"}
        </button>
      </div>
      <div className="flex min-h-16 flex-wrap items-center gap-2">
        {availableImages.map((image, index) => {
          const active = selected.includes(image);
          return (
            <label key={`${image}-${index}`} className={`relative flex items-center justify-center p-1 rounded-[var(--radius-md)] border cursor-pointer transition-all ${active ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] opacity-60"}`}>
              <input type="checkbox" checked={active} onChange={() => toggle(image)} className="h-3.5 w-3.5 accent-[var(--primary)]" />
              <img src={image} alt={`Start image ${index + 1}`} className="h-10 w-10 rounded object-cover" />
            </label>
          );
        })}
        {!availableImages.length && <p className="w-full py-3 text-center text-[11px] text-[var(--muted-foreground)]">Drop images here to use them as start photos</p>}
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)]">Drop image files here. New images are selected automatically.</p>
    </div>
  );
}
