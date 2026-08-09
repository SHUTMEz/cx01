"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  MinusSignIcon,
  SquareIcon,
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  Home01Icon,
  Settings01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/useStore";
import { deleteExportedFolder, deleteCardImages } from "../utils/imageStorage";
import { Tooltip } from "./Tooltip";
import { useRouter, usePathname } from "next/navigation";

interface TitlebarProps {
  icon?: IconSvgElement;
  title?: string;
}

export default function Titlebar({ icon, title }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearMode, setClearMode] = useState<"menu" | "custom" | "confirm">("menu");
  const [clearTarget, setClearTarget] = useState<"all" | "morning" | "afternoon" | "night" | "custom">("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const clearBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { cards, clearAllCards, deleteCards } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!showConfirm) {
      setClearMode("menu");
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        clearBtnRef.current && !clearBtnRef.current.contains(e.target as Node)
      ) {
        setShowConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showConfirm]);

  useEffect(() => {
    let unlisten: (() => void)[] = [];

    const setup = async () => {
      const appWindow = getCurrentWindow();

      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);

      const unlistenResize = await appWindow.onResized(async () => {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      });

      const unlistenFocus = await appWindow.onFocusChanged(({ payload }) => {
        setIsFocused(payload);
      });

      unlisten = [unlistenResize, unlistenFocus];
    };

    setup();

    return () => {
      unlisten.forEach((fn) => fn());
    };
  }, []);

  const handleMinimize = useCallback(async () => {
    await getCurrentWindow().minimize();
  }, []);

  const handleMaximize = useCallback(async () => {
    await getCurrentWindow().toggleMaximize();
  }, []);

  const handleClose = useCallback(async () => {
    await getCurrentWindow().close();
  }, []);

  const handleClearTarget = async () => {
    let toDelete = cards;
    if (clearTarget !== "all") {
      toDelete = cards.filter(card => {
        const d = new Date(card.createdAt);
        const h = d.getHours();
        if (clearTarget === "morning") return h >= 6 && h < 12;
        if (clearTarget === "afternoon") return h >= 12 && h < 18;
        if (clearTarget === "night") return h >= 18 || h < 6;
        if (clearTarget === "custom") {
           const [sh, sm] = customStart.split(":").map(Number);
           const [eh, em] = customEnd.split(":").map(Number);
           const startMin = sh * 60 + sm;
           const endMin = eh * 60 + em;
           const cardMin = h * 60 + d.getMinutes();
           if (startMin <= endMin) {
             return cardMin >= startMin && cardMin <= endMin;
           } else {
             return cardMin >= startMin || cardMin <= endMin;
           }
        }
        return false;
      });
    }

    if (toDelete.length === 0) {
      setShowConfirm(false);
      return;
    }

    const ids = toDelete.map(c => c.id);
    for (const card of toDelete) {
      if (card.exportedPath) {
        await deleteExportedFolder(card.exportedPath);
      }
      await deleteCardImages(card.id);
    }
    
    if (clearTarget === "all") {
      clearAllCards();
    } else {
      deleteCards(ids);
    }
    setShowConfirm(false);
    setClearMode("menu");
  };

  const iconColor = isFocused ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/60";

  return (
    <div
      data-tauri-drag-region
      className={`flex items-center h-8 min-h-8 select-none relative z-[9999] transition-colors duration-200
        ${isFocused ? "bg-[var(--surface)]" : "bg-[var(--background)]"}`}
    >
      <div data-tauri-drag-region className="flex flex-1 items-center justify-start h-full pl-4 gap-2">
        {icon && (
          <HugeiconsIcon
            icon={icon}
            size={18}
            className={`${iconColor} transition-colors duration-150`}
          />
        )}
        {title && (
          <span className={`text-[13px] font-semibold leading-none transition-colors duration-200
            ${isFocused ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]/60"}`}>
            {title}
          </span>
        )}
      </div>

      <div data-tauri-drag-region className="flex flex-1 items-stretch justify-end h-full">
        {pathname !== "/" && (
          <Tooltip content="Home">
            <motion.button
              className="flex items-center justify-center w-8 h-full border-none bg-transparent cursor-pointer p-0 outline-none hover:bg-[var(--foreground)]/[0.08] active:bg-[var(--foreground)]/[0.04] transition-colors duration-100"
              onClick={() => router.push("/")}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              aria-label="Home"
            >
              <HugeiconsIcon icon={Home01Icon} size={15} className={`${iconColor} transition-colors duration-150`} />
            </motion.button>
          </Tooltip>
        )}
        
        {pathname !== "/settings" && (
          <Tooltip content="Settings">
            <motion.button
              className="flex items-center justify-center w-8 h-full border-none bg-transparent cursor-pointer p-0 outline-none hover:bg-[var(--foreground)]/[0.08] active:bg-[var(--foreground)]/[0.04] transition-colors duration-100"
              onClick={() => router.push("/settings")}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              aria-label="Settings"
            >
              <HugeiconsIcon icon={Settings01Icon} size={15} className={`${iconColor} transition-colors duration-150`} />
            </motion.button>
          </Tooltip>
        )}

        <div className="relative">
          <Tooltip content={showConfirm ? "" : "Clear All"} disabled={showConfirm}>
            <motion.button
              ref={clearBtnRef}
              className="group flex items-center justify-center w-8 h-full border-none bg-transparent cursor-pointer p-0 outline-none hover:bg-[var(--foreground)]/[0.08] active:bg-[var(--foreground)]/[0.04] transition-colors duration-100"
              onClick={() => setShowConfirm(v => !v)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              aria-label="Clear All Data"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={15}
                className={`${iconColor} transition-colors duration-150 group-hover:text-[var(--danger)] ${showConfirm ? "text-[var(--danger)]" : ""}`}
              />
            </motion.button>
          </Tooltip>

          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="absolute top-full right-0 mt-2 z-[99999] flex flex-col bg-[var(--surface)] border border-[var(--border)] shadow-lg rounded-[var(--radius-xl)] overflow-hidden min-w-[140px]"
                ref={popoverRef}
              >
                {clearMode === "menu" && (
                  <div className="flex flex-col p-1">
                    {[
                      { id: "all", label: "Clear All" },
                      { id: "morning", label: "Morning (06:00 - 11:59)" },
                      { id: "afternoon", label: "Afternoon (12:00 - 17:59)" },
                      { id: "night", label: "Night (18:00 - 05:59)" },
                      { id: "custom", label: "Custom Range..." },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setClearTarget(opt.id as any);
                          if (opt.id === "custom") setClearMode("custom");
                          else setClearMode("confirm");
                        }}
                        className="text-left px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--input)] rounded-[var(--radius-md)] transition-colors whitespace-nowrap"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {clearMode === "custom" && (
                  <div className="flex flex-col p-3 gap-3 w-44">
                    <span className="text-xs font-bold text-[var(--foreground)]">Select Time Range</span>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[var(--muted-foreground)]">From:</label>
                      <input 
                        type="time" 
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full text-xs p-1.5 bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[var(--muted-foreground)]">To:</label>
                      <input 
                        type="time" 
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full text-xs p-1.5 bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <button onClick={() => setClearMode("menu")} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Back</button>
                      <button 
                        onClick={() => setClearMode("confirm")}
                        disabled={!customStart || !customEnd}
                        className="text-xs bg-[var(--danger)] text-white px-3 py-1.5 rounded-[var(--radius-md)] disabled:opacity-50 transition-all hover:brightness-110"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {clearMode === "confirm" && (
                  <div className="flex flex-col items-center gap-2 p-3 min-w-[120px]">
                    <span className="text-xs font-semibold text-[var(--foreground)] whitespace-nowrap">Are you sure?</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] text-center mb-1">
                      {clearTarget === "all" ? "All cards will be deleted" : 
                       clearTarget === "custom" ? "Cards in range will be deleted" :
                       `Cards in ${clearTarget} will be deleted`}
                    </span>
                    <div className="flex items-center gap-2 w-full justify-center">
                      <motion.button
                        onClick={handleClearTarget}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors duration-150"
                        aria-label="Confirm delete"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </motion.button>
                      <motion.button
                        onClick={() => setClearMode("menu")}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors duration-150"
                        aria-label="Cancel"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Tooltip content="Minimize">
          <motion.button
            className="flex items-center justify-center w-[46px] h-full border-none bg-transparent cursor-pointer p-0 outline-none
              hover:bg-[var(--foreground)]/[0.08] active:bg-[var(--foreground)]/[0.04] transition-colors duration-100"
            onClick={handleMinimize}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Minimize"
          >
            <HugeiconsIcon
              icon={MinusSignIcon}
              size={18}
              className={`${iconColor} transition-colors duration-150`}
            />
          </motion.button>
        </Tooltip>

        <Tooltip content={isMaximized ? "Restore" : "Maximize"}>
          <motion.button
            className="flex items-center justify-center w-[46px] h-full border-none bg-transparent cursor-pointer p-0 outline-none
              hover:bg-[var(--foreground)]/[0.08] active:bg-[var(--foreground)]/[0.04] transition-colors duration-100"
            onClick={handleMaximize}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMaximized ? "restore" : "maximize"}
                initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 90 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <HugeiconsIcon
                  icon={isMaximized ? Copy01Icon : SquareIcon}
                  size={18}
                  className={`${iconColor} transition-colors duration-150`}
                />
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </Tooltip>

        <Tooltip content="Close">
          <motion.button
            className="group flex items-center justify-center w-[46px] h-full border-none bg-transparent cursor-pointer p-0 outline-none
              hover:bg-[var(--danger)] active:bg-[#c03537] transition-colors duration-100"
            onClick={handleClose}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Close"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              className={`transition-colors duration-150 group-hover:text-[var(--foreground)]
                ${isFocused ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/60"}`}
            />
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}
