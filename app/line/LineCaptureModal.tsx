"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Tick02Icon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import { saveCardImages } from "../utils/imageStorage";
import { splitLineCardImagePaths } from "./lineCardImages";

const categories = ["🦐", "🦞", "🦑", "🐙", "🐚", "🦪", "🦀", "🐟", "🪼", "⭐", "🍱"];

export default function LineCaptureModal() {
  const { lineCapture, clearLineCapture, addCard, copyLineImage, settings } = useStore();
  const [draftText, setDraftText] = useState<string | undefined>();
  const [category, setCategory] = useState("⭐");
  const close = () => { setDraftText(undefined); clearLineCapture(); };
  if (lineCapture.status === "idle") return null;

  const save = async () => {
    const text = draftText ?? lineCapture.text;
    if (!lineCapture.images.length || !text.trim()) return;
    const id = uuidv4();
    try {
      const configuredStartImages = settings.startPhotos || [];
      const savedPaths = await saveCardImages(id, [...configuredStartImages, ...lineCapture.images]);
      const { startImages, images } = splitLineCardImagePaths(configuredStartImages, savedPaths);
      await addCard({ id, images, startImages, text: text.trim(), category, createdAt: Date.now() });
      close();
      toast.success("Card saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Card");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold text-[var(--foreground)]">{lineCapture.status === "waiting-text" ? "Waiting for text" : "Check your Card"}</h2><p className="mt-1 text-xs text-[var(--muted-foreground)]">{lineCapture.status === "waiting-text" ? "Send a text message to complete this item" : "Edit the text and choose a category before saving"}</p></div><button type="button" onClick={close} aria-label="Close"><HugeiconsIcon icon={Cancel01Icon} size={19} className="text-[var(--muted-foreground)]" /></button></div>
        <div className="mb-4 grid grid-cols-4 gap-2">{lineCapture.images.map((src, index) => <div key={`${src}-${index}`} className="group relative aspect-square"><img src={src} alt={`Received ${index + 1}`} className="h-full w-full rounded-[var(--radius-md)] object-cover" /><button type="button" onClick={() => copyLineImage(index)} aria-label={`Copy image ${index + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"><HugeiconsIcon icon={Copy01Icon} size={14} /></button></div>)}</div>
        {lineCapture.status === "ready-to-save" && <>
          <textarea value={draftText ?? lineCapture.text} onChange={(event) => setDraftText(event.target.value)} className="mb-4 min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--input)] p-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          <div className="mb-5"><p className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">Category</p><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border text-lg transition ${category === item ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]"}`}>{item}</button>)}</div></div>
          <button type="button" onClick={() => void save()} className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]"><HugeiconsIcon icon={Tick02Icon} size={18} />Save Card</button>
        </>}
      </div>
    </div>
  );
}
