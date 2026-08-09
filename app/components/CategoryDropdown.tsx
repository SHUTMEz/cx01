"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowDown01Icon, 
  Folder01Icon, 
  Search01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon
} from "@hugeicons-pro/core-solid-rounded";

interface CategoryDropdownProps {
  categories: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function CategoryDropdown({ categories, value, onChange }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus input when dropdown opens
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Clear search when closed
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-[var(--radius-xl)] bg-[var(--surface)] hover:bg-[var(--input)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium transition-all shadow-sm focus:outline-none focus:border-[var(--primary)] min-w-[120px]"
        >
          <div className="flex items-center gap-2 truncate">
            <HugeiconsIcon icon={Folder01Icon} size={14} className="text-[var(--muted-foreground)] shrink-0" />
            <span className="truncate">Filter by: {value || "All Categories"}</span>
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
              className="absolute left-0 mt-2 w-56 bg-[var(--background)]/95 backdrop-blur-md border border-[var(--border)] rounded-[var(--radius-xl)] shadow-lg z-50 flex flex-col overflow-hidden"
            >
              <div className="p-2 border-b border-[var(--border)]">
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--input)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
                <button
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors rounded-md
                    ${value === null ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold" : "text-[var(--foreground)] hover:bg-[var(--surface)]"}
                  `}
                >
                  <span>All Categories</span>
                  {value === null && (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-[var(--primary)]" />
                  )}
                </button>
                {filteredCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onChange(cat);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors rounded-md
                      ${value === cat ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold" : "text-[var(--foreground)] hover:bg-[var(--surface)]"}
                    `}
                  >
                    <span className="truncate">{cat}</span>
                    {value === cat && (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-[var(--primary)] shrink-0" />
                    )}
                  </button>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                    No categories found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {value && (
        <button
          onClick={() => onChange(null)}
          className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-xl)] bg-[var(--surface)] hover:bg-[var(--danger)]/10 text-[var(--muted-foreground)] hover:text-[var(--danger)] border border-[var(--border)] transition-all shadow-sm focus:outline-none"
          title="Reset Category"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      )}
    </div>
  );
}
