"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
}

export function Tooltip({ children, content, disabled }: TooltipProps) {
  if (disabled || !content) return <>{children}</>;
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-[10000] px-2.5 py-1.5 bg-white dark:bg-[#111111] text-black dark:text-white border border-gray-200 dark:border-gray-800 text-[11px] font-bold rounded-[var(--radius-sm)] shadow-lg will-change-[transform,opacity] select-none"
            sideOffset={6}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
