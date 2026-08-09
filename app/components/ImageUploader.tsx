"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, Delete01Icon } from "@hugeicons-pro/core-solid-rounded";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function ImageUploader({ images, onChange, multiple = false, className }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const readImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    void Promise.all(Array.from(files).map(readImage)).then((newImages) => {
      onChange(multiple ? [...images, ...newImages] : [newImages[0]]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
      if (files.length === 0) return;

      void Promise.all(files.map(readImage)).then((newImages) => {
        onChange(multiple ? [...images, ...newImages] : [newImages[0]]);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col gap-3 p-3 rounded-[var(--radius-lg)] border transition-all duration-200",
        isDraggingOver ? "bg-[var(--muted)] border-[var(--primary)] scale-[1.02]" : "bg-transparent border-transparent",
        className
      )}
    >
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, index) => (
            <div key={index} className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden group">
              <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-[var(--danger)] rounded-full text-[var(--primary-foreground)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <HugeiconsIcon icon={Delete01Icon} size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(!images.length || multiple) && (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xl)] bg-[var(--input)] cursor-pointer hover:bg-[var(--muted)] transition-colors duration-200">
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <HugeiconsIcon icon={Image01Icon} size={24} className="text-[var(--muted-foreground)] mb-2" />
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            {multiple ? "Add Photos" : "Add Photo"}
          </span>
        </label>
      )}
    </div>
  );
}
