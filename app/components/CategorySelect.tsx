"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, ArrowDown01Icon, Add01Icon } from "@hugeicons-pro/core-solid-rounded";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { settings, updateSettings } = useStore();
  const categories = settings.categories || [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = categories.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = categories.find((c) => c.toLowerCase() === search.toLowerCase());

  const handleSelect = (cat: string) => {
    onChange(cat);
    setSearch("");
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (search.trim() && !exactMatch) {
      const newCat = search.trim();
      updateSettings({ categories: [...categories, newCat] });
      onChange(newCat);
      setSearch("");
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex items-center w-full h-11 bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-xl)] px-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`flex-1 truncate text-sm ${value ? "text-[var(--foreground)] font-medium" : "text-[var(--muted-foreground)]"}`}>
          {value || "Select a category..."}
        </span>
        <HugeiconsIcon icon={isOpen ? Search01Icon : ArrowDown01Icon} size={16} className="text-[var(--muted-foreground)] ml-2 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-lg z-50 overflow-hidden flex flex-col max-h-60">
          <div className="p-2 border-b border-[var(--border)] flex items-center gap-2">
            <HugeiconsIcon icon={Search01Icon} size={16} className="text-[var(--muted-foreground)] shrink-0" />
            <input 
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or add..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1">
            {filtered.map(cat => (
              <button
                key={cat}
                onClick={() => handleSelect(cat)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${value === cat ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
              >
                {cat}
              </button>
            ))}
            
            {search.trim() && !exactMatch && (
              <button
                onClick={handleAdd}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] font-medium hover:bg-[var(--muted)] rounded-md transition-colors"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Add "{search.trim()}"
              </button>
            )}
            
            {filtered.length === 0 && (!search.trim() || exactMatch) && (
              <div className="px-3 py-3 text-sm text-[var(--muted-foreground)] text-center">
                No categories found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
