"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useStore } from "../store/useStore";
import ImageUploader from "../components/ImageUploader";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Image01Icon, Txt01Icon, Folder01Icon, Delete02Icon, Add01Icon } from "@hugeicons-pro/core-solid-rounded";
import { open } from "@tauri-apps/plugin-dialog";
import { deleteCardImages, deleteExportedFolder } from "../utils/imageStorage";
import { toast } from "sonner";

export default function SettingsPage() {
  const { cards, settings, updateSettings, deleteCards } = useStore();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  if (!mounted) return null;

  const handleDeleteCategory = async (category: string) => {
    const affectedCards = cards.filter((card) => card.category === category);

    // File cleanup is best-effort. A missing/locked file must not block
    // deleting the category and its database records.
    await Promise.allSettled(affectedCards.flatMap((card) => [
      deleteCardImages(card.id),
      ...(card.exportedPath ? [deleteExportedFolder(card.exportedPath)] : []),
    ]));
    try {
      await deleteCards(affectedCards.map((card) => card.id));
    setDraft((current) => ({ ...current, categories: (current.categories || []).filter((item) => item !== category) }));
      setPendingDeleteCategory(null);
      toast.success("Category deleted");
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error("Could not delete category");
    }
  };

  const pendingCards = pendingDeleteCategory
    ? cards.filter((card) => card.category === pendingDeleteCategory).length
    : 0;

  const saveDraft = async () => {
    await updateSettings(draft);
    toast.success("Settings saved");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 w-full max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-2 px-1">
        <HugeiconsIcon icon={Settings01Icon} size={24} className="text-[var(--foreground)]" />
        <h1 className="text-xl font-bold text-[var(--foreground)]">Settings</h1>
      </div>

      <div className="flex flex-col bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-sm overflow-hidden">
        
        {/* Export Folder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Folder01Icon} size={16} className="text-[var(--warning)]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Export Folder</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0">
            {draft.exportPath && (
              <span className="text-xs text-[var(--muted-foreground)] max-w-full sm:max-w-[250px] truncate" title={draft.exportPath}>
                {draft.exportPath}
              </span>
            )}
            <button
              onClick={async () => {
                const selected = await open({ directory: true, multiple: false });
                if (selected && typeof selected === "string") setDraft((current) => ({ ...current, exportPath: selected }));
              }}
              className="w-full sm:w-auto px-4 h-8 shrink-0 bg-[var(--input)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-bold rounded-[var(--radius-md)] transition-colors border border-[var(--border)] whitespace-nowrap shadow-sm"
            >
              {draft.exportPath ? "Change" : "Select Folder"}
            </button>
          </div>
        </div>

        {/* Start Photos */}
        <div className="flex flex-col p-4 sm:p-5 border-b border-[var(--border)] gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Image01Icon} size={16} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Start Photos</h2>
          </div>
          <div className="pl-0 sm:pl-11 w-full">
            <ImageUploader
              images={draft.startPhotos || []}
              onChange={(imgs) => setDraft((current) => ({ ...current, startPhotos: imgs }))}
              multiple={true}
            />
          </div>
        </div>

        {/* End Text */}
        <div className="flex flex-col p-4 sm:p-5 border-b border-[var(--border)] gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--info)]/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Txt01Icon} size={16} className="text-[var(--info)]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">End Text</h2>
          </div>
          <div className="pl-0 sm:pl-11 w-full">
            <textarea
              value={draft.endText}
              onChange={(e) => setDraft((current) => ({ ...current, endText: e.target.value }))}
              placeholder="🙏 ขอบคุณลูกค้าทุกท่าน\nพร้อมส่งทั่วไทย 🇹🇭"
              className="w-full min-h-[100px] bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-lg)] p-3 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--info)] transition-all resize-none shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col p-4 sm:p-5 gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Settings01Icon} size={16} className="text-[var(--success)]" />
            </div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Categories</h2>
          </div>
          
          <div className="pl-0 sm:pl-11 flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-2">
              {draft.categories?.map((cat) => (
                <div key={cat} className="flex items-center gap-1.5 pl-3 pr-1 py-1 bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-sm">
                  <span className="text-xs text-[var(--foreground)] font-medium">{cat}</span>
                  <button
                    onClick={() => setPendingDeleteCategory(cat)}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:max-w-xs mt-1">
              <input
                type="text"
                id="new-category"
                placeholder="Add category..."
                className="w-full h-8 px-3 bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !draft.categories?.includes(val)) {
                      setDraft((current) => ({ ...current, categories: [...(current.categories || []), val] }));
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("new-category") as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !draft.categories?.includes(val)) {
                    setDraft((current) => ({ ...current, categories: [...(current.categories || []), val] }));
                    input.value = "";
                  }
                }}
                className="w-full sm:w-auto h-8 px-4 flex items-center justify-center gap-1.5 bg-[var(--primary)] hover:brightness-110 text-[var(--primary-foreground)] text-xs font-bold rounded-[var(--radius-md)] transition-colors shadow-sm shrink-0"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Add
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => void saveDraft()} className="h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] hover:brightness-110 shadow-sm">
          Save settings
        </button>
      </div>

      {pendingDeleteCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onMouseDown={() => setPendingDeleteCategory(null)}>
          <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-base font-bold text-[var(--foreground)]">Delete category?</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Delete “{pendingDeleteCategory}”{pendingCards ? ` and ${pendingCards} card(s)` : ""}? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDeleteCategory(null)} className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] px-4 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={() => void handleDeleteCategory(pendingDeleteCategory)} className="h-9 rounded-[var(--radius-md)] bg-[var(--danger)] px-4 text-sm font-semibold text-white hover:brightness-110">Delete</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
