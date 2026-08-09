"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { v4 as uuidv4 } from "uuid";
import { useStore } from "../store/useStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon, Image02Icon, Note01Icon, Folder01Icon, Tick02Icon, Add01Icon, Cancel01Icon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { getImageSrc } from "../utils/imageStorage";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableImageItem } from "../components/SortableImageItem";
import { CategorySelect } from "../components/CategorySelect";
import StartImageSelector from "../components/StartImageSelector";
import TextEditor from "../components/TextEditor";

interface ImageObj {
  id: string;
  src: string;
}

function EditCardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { cards, updateCard, settings, updateSettings } = useStore();
  const [mounted, setMounted] = useState(false);

  const [images, setImages] = useState<ImageObj[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selectedStartImages, setSelectedStartImages] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (card) {
      setImages(card.images.map((src) => ({ id: uuidv4(), src })));
      setText(card.text);
      setCategory(card.category);
      // Edit must reflect this card's saved selection. An empty selection means none,
      // never fall back to selecting every image from Settings.
      setSelectedStartImages(card.startImages ?? []);
    }
  }, [cards, id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages((prev) => [...prev, { id: uuidv4(), src: base64 }]);
      };
      reader.readAsDataURL(file);
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
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setImages((prev) => [...prev, { id: uuidv4(), src: base64 }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSave = async () => {
    if (!id) return;
    await updateCard(id, {
      images: images.map((i) => i.src),
      startImages: selectedStartImages,
      text: text.trim(),
      category: category || "Other",
    });
    toast.success("Card updated successfully");
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Edit01Icon} size={24} className="text-[var(--muted-foreground)]" />
          <h1 className="text-xl font-bold text-[var(--foreground)]">Edit Card</h1>
        </div>
      </div>

      <section
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-3 p-4 rounded-[var(--radius-xl)] border transition-all duration-200 ${
          isDraggingOver ? "bg-[var(--muted)] border-[var(--primary)] scale-[1.02]" : "bg-[var(--surface)] border-[var(--border)]"
        }`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Image02Icon} size={20} className="text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-bold text-[var(--foreground)]">Photos {isDraggingOver && "(Drop here)"}</h2>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
              {images.map((img) => (
                <SortableImageItem key={img.id} id={img.id} src={getImageSrc(img.src)} onRemove={removeImage} />
              ))}
            </SortableContext>

            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--input)] cursor-pointer hover:bg-[var(--muted)] transition-colors duration-200">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <HugeiconsIcon icon={Add01Icon} size={24} className="text-[var(--muted-foreground)] mb-1" />
              <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Add Photos</span>
            </label>
          </div>
        </DndContext>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2"><HugeiconsIcon icon={Image02Icon} size={20} className="text-[var(--muted-foreground)]" /><h2 className="text-sm font-bold text-[var(--foreground)]">Start images from Settings</h2></div>
        <StartImageSelector images={settings.startPhotos || []} selected={selectedStartImages} onChange={setSelectedStartImages} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Note01Icon} size={20} className="text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-bold text-[var(--foreground)]">Details</h2>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
          <input type="checkbox" checked={settings.useEndText} onChange={(event) => void updateSettings({ useEndText: event.target.checked })} className="accent-[var(--primary)]" />
          Use footer text
        </label>
        <TextEditor
          value={text}
          onChange={setText}
          categories={settings.categories || []}
          onSelectCategory={setCategory}
          placeholder="Enter product name, description, price..."
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Folder01Icon} size={20} className="text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-bold text-[var(--foreground)]">Category</h2>
        </div>
        <CategorySelect value={category} onChange={setCategory} />
      </section>

      <div className="sticky bottom-0 pt-4 pb-2 z-40 bg-[var(--background)] flex justify-end gap-3">
        <div className="absolute inset-0 -top-8 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
        <button
          onClick={handleSave}
          className="relative flex flex-1 sm:flex-none items-center justify-center gap-2 h-12 px-8 bg-[var(--primary)] hover:brightness-110 text-[var(--primary-foreground)] text-sm font-bold rounded-[var(--radius-xl)] transition-all shadow-[0_4px_14px_0_rgba(255,32,86,0.39)]"
        >
          <HugeiconsIcon icon={Tick02Icon} size={20} />
          Update Card
        </button>
        <button
          onClick={() => router.push("/")}
          className="relative flex items-center justify-center shrink-0 w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all shadow-md"
          aria-label="Cancel"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-zinc-400" />
        </button>
      </div>
    </motion.div>
  );
}

export default function EditCardPage() {
  return (
    <Suspense fallback={<div className="p-5 text-[var(--foreground)]">Loading...</div>}>
      <EditCardForm />
    </Suspense>
  );
}
