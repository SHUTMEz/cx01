"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowDown01Icon, 
  Clock01Icon, 
  ArrowUp01Icon,
  Menu01Icon,
  CheckmarkCircle01Icon
} from "@hugeicons-pro/core-solid-rounded";

export type SortOption = "default" | "newest" | "oldest" | "count_desc" | "count_asc";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: any }[] = [
  { value: "default", label: "Default Order", icon: Menu01Icon },
  { value: "newest", label: "Newest First", icon: Clock01Icon },
  { value: "oldest", label: "Oldest First", icon: Clock01Icon },
  { value: "count_desc", label: "Most Count", icon: ArrowDown01Icon },
  { value: "count_asc", label: "Least Count", icon: ArrowUp01Icon },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = sortOptions.find(o => o.value === value) || sortOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-[var(--radius-xl)] bg-[var(--surface)] hover:bg-[var(--input)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium transition-all shadow-sm focus:outline-none focus:border-[var(--primary)] min-w-[120px]"
      >
        <div className="flex items-center gap-2 truncate">
          <HugeiconsIcon icon={selectedOption.icon} size={14} className="text-[var(--muted-foreground)] shrink-0" />
          <span className="truncate">Order by: {selectedOption.label}</span>
        </div>
        <HugeiconsIcon 
          icon={ArrowDown01Icon} 
          size={14} 
          className={`text-[var(--muted-foreground)] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 bg-[var(--background)]/90 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-xl)] shadow-lg z-50 overflow-hidden py-1"
          >
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors
                  ${value === option.value ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold" : "text-[var(--foreground)] hover:bg-[var(--surface)]"}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon 
                    icon={option.icon} 
                    size={16} 
                    className={value === option.value ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"} 
                  />
                  {option.label}
                </div>
                {value === option.value && (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-[var(--primary)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
