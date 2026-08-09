"use client";

interface StartImageSelectorProps {
  images: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function StartImageSelector({ images, selected, onChange }: StartImageSelectorProps) {
  if (!images.length) return null;
  const allSelected = selected.length === images.length;
  const toggle = (image: string) => onChange(selected.includes(image)
    ? selected.filter((item) => item !== image)
    : [...selected, image]);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--input)] border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--foreground)]">Start images</span>
        <button type="button" onClick={() => onChange(allSelected ? [] : images)} className="text-[11px] text-[var(--primary)] font-semibold">
          {allSelected ? "Clear all" : "Use all"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {images.map((image, index) => {
          const active = selected.includes(image);
          return (
            <label key={`${image}-${index}`} className={`relative flex items-center justify-center p-1 rounded-[var(--radius-md)] border cursor-pointer transition-all ${active ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] opacity-60"}`}>
              <input type="checkbox" checked={active} onChange={() => toggle(image)} className="h-3.5 w-3.5 accent-[var(--primary)]" />
              <img src={image} alt={`Start image ${index + 1}`} className="h-10 w-10 rounded object-cover" />
            </label>
          );
        })}
      </div>
    </div>
  );
}
