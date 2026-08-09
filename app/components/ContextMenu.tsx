"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Add01Icon,
  RefreshIcon,
} from "@hugeicons-pro/core-solid-rounded";

interface ContextMenuItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

function ContextMenuPopup({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener("mousedown", handleDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Clamp to viewport
  const [pos, setPos] = useState({ x, y });
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      x: x + rect.width > vw ? vw - rect.width - 8 : x,
      y: y + rect.height > vh ? vh - rect.height - 8 : y,
    });
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.94, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 99999 }}
      className="min-w-[160px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden py-1"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors
            ${item.danger
              ? "text-[var(--danger)] hover:bg-[var(--danger)]/10"
              : "text-[var(--foreground)] hover:bg-[var(--input)]"
            }`}
        >
          <HugeiconsIcon icon={item.icon} size={15} className="shrink-0 opacity-70" />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

interface UseContextMenuOptions {
  onAddCard: () => void;
  onRefresh: () => void;
  onEditCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
}

export function useContextMenu({ onAddCard, onRefresh, onEditCard, onDeleteCard }: UseContextMenuOptions) {
  const [menu, setMenu] = useState<{ x: number; y: number; cardId: string | null } | null>(null);

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Globally disable native context menu
      
      const target = e.target as HTMLElement;
      // Look for a parent with data-card-id
      const cardEl = target.closest('[data-card-id]');
      if (cardEl) {
        const id = cardEl.getAttribute('data-card-id');
        setMenu({ x: e.clientX, y: e.clientY, cardId: id });
      } else {
        // It's the background
        setMenu({ x: e.clientX, y: e.clientY, cardId: null });
      }
    };

    document.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => document.removeEventListener("contextmenu", handleGlobalContextMenu);
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: ContextMenuItem[] = menu?.cardId
    ? [
        { label: "Edit Card", icon: Edit01Icon, onClick: () => onEditCard(menu.cardId!) },
        { label: "Delete Card", icon: Delete01Icon, onClick: () => onDeleteCard(menu.cardId!), danger: true },
        { label: "Refresh", icon: RefreshIcon, onClick: onRefresh },
      ]
    : [
        { label: "Add Card", icon: Add01Icon, onClick: onAddCard },
        { label: "Refresh", icon: RefreshIcon, onClick: onRefresh },
      ];

  const ContextMenu = menu ? (
    <AnimatePresence>
      <ContextMenuPopup
        key="ctx"
        items={menuItems}
        x={menu.x}
        y={menu.y}
        onClose={closeMenu}
      />
    </AnimatePresence>
  ) : null;

  return { closeMenu, ContextMenu };
}
