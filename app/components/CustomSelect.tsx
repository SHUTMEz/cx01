"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, CheckmarkCircle01Icon } from "@hugeicons-pro/core-solid-rounded";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({ value, options, onChange, disabled = false, className = "" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className="flex items-center justify-between gap-2 w-full h-8 px-2.5 rounded-[var(--radius-md)] bg-[var(--input)] text-xs font-semibold text-[var(--foreground)] outline-none transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40">
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14, ease: "easeOut" }} className="absolute top-full left-0 right-0 mt-1.5 z-[80] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] shadow-lg">
            <div className="max-h-56 overflow-y-auto p-1">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-[var(--radius-md)] text-left text-xs transition-colors ${active ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold" : "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}>
                    <span className="truncate">{option.label}</span>
                    {active && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="shrink-0 text-[var(--primary)]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
