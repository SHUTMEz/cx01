"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Home01Icon, Link01Icon, Settings01Icon } from "@hugeicons-pro/core-solid-rounded";
import { motion } from "motion/react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Cards", icon: Home01Icon },
    { href: "/create", label: "Create", icon: Add01Icon },
    { href: "/line", label: "LINE", icon: Link01Icon },
    { href: "/settings", label: "Settings", icon: Settings01Icon },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 lg:bottom-auto lg:left-3 lg:top-1/2 lg:w-14 lg:max-w-none lg:-translate-y-1/2 lg:translate-x-0">
      <nav className="flex h-14 items-center justify-around gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:h-auto lg:flex-col lg:rounded-[var(--radius-xl)] lg:py-2" aria-label="Main navigation">
        {items.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="flex h-full min-w-0 flex-1 items-center justify-center lg:w-11 lg:flex-none">
              <motion.div whileTap={{ scale: 0.92 }} className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-full transition-colors lg:w-11 ${active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                <HugeiconsIcon icon={icon} size={18} />
                <span className="hidden text-[10px] font-semibold min-[340px]:inline lg:hidden">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
