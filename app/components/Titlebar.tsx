"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, MinusSignIcon, SquareIcon } from "@hugeicons-pro/core-solid-rounded";
import { AnimatePresence, motion } from "motion/react";
import { Tooltip } from "./Tooltip";

interface TitlebarProps {
  icon?: IconSvgElement;
  logoSrc?: string;
  title?: string;
}

export default function Titlebar({ icon, logoSrc, title }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    let unlisten: (() => void)[] = [];
    const setup = async () => {
      const appWindow = getCurrentWindow();
      setIsMaximized(await appWindow.isMaximized());
      const unlistenResize = await appWindow.onResized(async () => setIsMaximized(await appWindow.isMaximized()));
      const unlistenFocus = await appWindow.onFocusChanged(({ payload }) => setIsFocused(payload));
      unlisten = [unlistenResize, unlistenFocus];
    };
    void setup();
    return () => unlisten.forEach((remove) => remove());
  }, []);

  const minimize = useCallback(async () => getCurrentWindow().minimize(), []);
  const maximize = useCallback(async () => getCurrentWindow().toggleMaximize(), []);
  const close = useCallback(async () => getCurrentWindow().close(), []);
  const iconColor = isFocused ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/60";

  return (
    <div data-tauri-drag-region className={`relative z-[9999] flex h-8 min-h-8 select-none items-center transition-colors ${isFocused ? "bg-[var(--surface)]" : "bg-[var(--background)]"}`}>
      <div data-tauri-drag-region className="flex h-full flex-1 items-center gap-2 pl-4">
        {logoSrc ? <img src={logoSrc} alt="" className="h-[18px] w-[18px] rounded-[5px] object-cover" /> : icon ? <HugeiconsIcon icon={icon} size={18} className={iconColor} /> : null}
        {title && <span className={`text-[13px] font-semibold leading-none ${isFocused ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]/60"}`}>{title}</span>}
      </div>

      <div data-tauri-drag-region className="flex h-full items-stretch">
        <Tooltip content="Minimize">
          <motion.button type="button" onClick={() => void minimize()} whileTap={{ scale: 0.9 }} className="flex h-full w-[46px] items-center justify-center bg-transparent transition-colors hover:bg-[var(--foreground)]/[0.08]" aria-label="Minimize">
            <HugeiconsIcon icon={MinusSignIcon} size={18} className={iconColor} />
          </motion.button>
        </Tooltip>
        <Tooltip content={isMaximized ? "Restore" : "Maximize"}>
          <motion.button type="button" onClick={() => void maximize()} whileTap={{ scale: 0.9 }} className="flex h-full w-[46px] items-center justify-center bg-transparent transition-colors hover:bg-[var(--foreground)]/[0.08]" aria-label={isMaximized ? "Restore" : "Maximize"}>
            <AnimatePresence mode="wait">
              <motion.span key={isMaximized ? "restore" : "maximize"} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                <HugeiconsIcon icon={isMaximized ? Copy01Icon : SquareIcon} size={18} className={iconColor} />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </Tooltip>
        <Tooltip content="Close">
          <motion.button type="button" onClick={() => void close()} whileTap={{ scale: 0.9 }} className="group flex h-full w-[46px] items-center justify-center bg-transparent transition-colors hover:bg-[var(--danger)]" aria-label="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={18} className={`${iconColor} group-hover:text-white`} />
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}
