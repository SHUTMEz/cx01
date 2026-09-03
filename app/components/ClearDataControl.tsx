"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { ClearDataTarget, selectCardIdsToClear } from "../clearData";
import { useStore } from "../store/useStore";
import { deleteCardImages, deleteExportedFolder } from "../utils/imageStorage";

type ClearMode = "menu" | "custom" | "confirm";

const options: { id: ClearDataTarget; label: string }[] = [
  { id: "all", label: "Clear All" },
  { id: "morning", label: "Morning (06:00 - 11:59)" },
  { id: "afternoon", label: "Afternoon (12:00 - 17:59)" },
  { id: "night", label: "Night (18:00 - 05:59)" },
  { id: "custom", label: "Custom Range…" },
];

export default function ClearDataControl() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ClearMode>("menu");
  const [target, setTarget] = useState<ClearDataTarget>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const { cards, clearAllCards, deleteCards } = useStore();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMode("menu");
      }
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);

  const clearData = async () => {
    const ids = selectCardIdsToClear(cards, target, customStart, customEnd);
    const selectedCards = cards.filter((card) => ids.includes(card.id));
    if (!selectedCards.length) {
      setOpen(false);
      toast.info("No cards found in this range");
      return;
    }
    try {
      for (const card of selectedCards) {
        if (card.exportedPath) await deleteExportedFolder(card.exportedPath);
        await deleteCardImages(card.id);
      }
      if (target === "all") await clearAllCards();
      else await deleteCards(ids);
      setOpen(false);
      setMode("menu");
      toast.success(`${selectedCards.length} card${selectedCards.length === 1 ? "" : "s"} cleared`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear cards");
    }
  };

  const targetDescription = target === "all"
    ? "All cards will be deleted"
    : target === "custom"
      ? "Cards in this range will be deleted"
      : `Cards in the ${target} will be deleted`;

  return (
    <div ref={rootRef} className="fixed right-3 top-14 z-[70]">
      <button
        type="button"
        onClick={() => {
          if (open) setMode("menu");
          setOpen((value) => !value);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-md transition hover:border-[var(--danger)]/40 hover:text-[var(--danger)]"
        aria-label="Clear data"
        aria-expanded={open}
      >
        <HugeiconsIcon icon={Delete02Icon} size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -5 }}
            className="absolute right-0 top-12 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
          >
            {mode === "menu" && options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTarget(option.id);
                  setMode(option.id === "custom" ? "custom" : "confirm");
                }}
                className="flex min-h-10 w-full items-center rounded-[var(--radius-md)] px-3 text-left text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                {option.label}
              </button>
            ))}

            {mode === "custom" && (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-xs font-bold text-[var(--foreground)]">Select time range</p>
                <label className="grid gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                  From
                  <input type="time" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--input)] px-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
                </label>
                <label className="grid gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                  To
                  <input type="time" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--input)] px-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setMode("menu")} className="h-9 px-3 text-xs text-[var(--muted-foreground)]">Back</button>
                  <button type="button" onClick={() => setMode("confirm")} disabled={!customStart || !customEnd} className="h-9 rounded-[var(--radius-md)] bg-[var(--danger)] px-3 text-xs font-semibold text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            )}

            {mode === "confirm" && (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]"><HugeiconsIcon icon={Delete02Icon} size={19} /></div>
                <div><p className="text-sm font-bold text-[var(--foreground)]">Clear data?</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{targetDescription}</p></div>
                <div className="grid w-full grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMode("menu")} className="flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)]"><HugeiconsIcon icon={Cancel01Icon} size={15} />Cancel</button>
                  <button type="button" onClick={() => void clearData()} className="flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--danger)] text-xs font-semibold text-white"><HugeiconsIcon icon={Delete02Icon} size={15} />Clear</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
