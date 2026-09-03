"use client";

import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Tick02Icon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import { saveCardImages } from "../utils/imageStorage";
import { splitLineCardImagePaths } from "./lineCardImages";

const categories = ["🦐", "🦞", "🦑", "🐙", "🐚", "🦪", "🦀", "🐟", "🪼", "⭐", "🍱"];

export default function LineCaptureModal() {
  const activeId = useStore((state) => state.lineCapture.queue[0]?.id);
  if (!activeId) return null;
  return <LineCaptureCard key={activeId} />;
}

function LineCaptureCard() {
  const { lineCapture, discardActiveLineCapture, completeLineCapture, addCard, copyLineImage, settings } = useStore();
  const activeCapture = lineCapture.queue[0];
  const [draftText, setDraftText] = useState<string | undefined>();
  const [category, setCategory] = useState("⭐");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const close = () => { setDraftText(undefined); discardActiveLineCapture(); };
  if (!activeCapture) return null;

  const save = async () => {
    const text = draftText ?? activeCapture.text;
    if (savingRef.current || activeCapture.status !== "ready-to-save" || !activeCapture.images.length || !text.trim()) return;
    savingRef.current = true;
    setIsSaving(true);
    const id = uuidv4();
    try {
      const configuredStartImages = settings.startPhotos || [];
      const savedPaths = await saveCardImages(id, [...configuredStartImages, ...activeCapture.images.map((image) => image.dataUrl)]);
      const { startImages, images } = splitLineCardImagePaths(configuredStartImages, savedPaths);
      await addCard({ id, images, startImages, text: text.trim(), category, createdAt: Date.now() });
      setDraftText(undefined);
      completeLineCapture(activeCapture.id);
      toast.success("Card saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Card");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const isLoading = activeCapture.status === "loading-images";
  const isWaitingText = activeCapture.status === "waiting-text";
  const title = isLoading ? "Loading photos" : isWaitingText ? "Waiting for text" : "Check your Card";
  const description = isLoading
    ? `${activeCapture.pendingImageIds.length} photo${activeCapture.pendingImageIds.length === 1 ? "" : "s"} still loading`
    : isWaitingText
      ? "Send a text message to complete this item"
      : "Edit the text and choose a category before saving";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>{lineCapture.queue.length > 1 && <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">+{lineCapture.queue.length - 1} queued</span>}</div><p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p></div><button type="button" onClick={close} aria-label="Close"><HugeiconsIcon icon={Cancel01Icon} size={19} className="text-[var(--muted-foreground)]" /></button></div>
        <div className="mb-4 grid grid-cols-4 gap-2">{activeCapture.images.map((image, index) => <div key={image.messageId} className="group relative aspect-square"><img src={image.dataUrl} alt={`Received ${index + 1}`} className="h-full w-full rounded-[var(--radius-md)] object-cover" /><button type="button" onClick={() => copyLineImage(index)} aria-label={`Copy image ${index + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"><HugeiconsIcon icon={Copy01Icon} size={14} /></button></div>)}</div>
        {isLoading && <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" /><p className="text-xs text-[var(--muted-foreground)]">Please wait until every photo finishes loading.</p></div>}
        {activeCapture.failedImageCount > 0 && <p className="mb-4 text-xs font-medium text-[var(--warning)]">{activeCapture.failedImageCount} photo{activeCapture.failedImageCount === 1 ? "" : "s"} could not be loaded.</p>}
        {activeCapture.status === "ready-to-save" && <>
          <textarea value={draftText ?? activeCapture.text} onChange={(event) => setDraftText(event.target.value)} className="mb-4 min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--input)] p-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          <div className="mb-5"><p className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">Category</p><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border text-lg transition ${category === item ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]"}`}>{item}</button>)}</div></div>
          <button type="button" onClick={() => void save()} disabled={isSaving} className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)] disabled:cursor-wait disabled:opacity-60"><HugeiconsIcon icon={Tick02Icon} size={18} />{isSaving ? "Saving…" : "Save Card"}</button>
        </>}
      </div>
    </div>
  );
}
