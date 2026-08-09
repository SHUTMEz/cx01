"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, Settings01Icon, Add01Icon } from "@hugeicons-pro/core-solid-rounded";
import { motion } from "motion/react";

export default function BottomNav() {
  const pathname = usePathname();

  // If we are on create or edit page, maybe don't show the plus button
  if (pathname === "/create" || pathname === "/edit") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/create">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)] shadow-[0_4px_14px_0_rgba(255,32,86,0.39)] text-[var(--primary-foreground)] cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} size={28} />
        </motion.div>
      </Link>
    </div>
  );
}
