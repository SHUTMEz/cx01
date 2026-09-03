"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Settings01Icon,
} from "@hugeicons-pro/core-solid-rounded";

type ContextAction = {
  label: string;
  href?: string;
  event?: string;
  tone?: "primary" | "default";
  onClick?: () => void;
};

const pageCopy: Record<string, { title: string; description: string; actions: ContextAction[] }> = {
  "/": {
    title: "Card workspace",
    description: "Quick actions for your card library.",
    actions: [
      { label: "New Card", href: "/create", tone: "primary" },
      { label: "Refresh cards", onClick: () => window.location.reload() },
      { label: "Use table view", event: "cards:view-table" },
      { label: "Open settings", href: "/settings" },
    ],
  },
  "/create": {
    title: "Create Card",
    description: "Jump between sections while building a card.",
    actions: [
      { label: "Add photos", href: "#photos", tone: "primary" },
      { label: "Go to details", href: "#details" },
      { label: "Go to category", href: "#category" },
    ],
  },
  "/edit": {
    title: "Edit Card",
    description: "Keep the important editing actions close by.",
    actions: [
      { label: "Go to photos", href: "#photos", tone: "primary" },
      { label: "Go to details", href: "#details" },
      { label: "Go to category", href: "#category" },
    ],
  },
  "/line": {
    title: "LINE service",
    description: "Manage the connection and incoming capture flow.",
    actions: [
      { label: "Login to LINE", event: "line:login", tone: "primary" },
      { label: "Start service", event: "line:start" },
      { label: "Stop service", event: "line:stop" },
      { label: "View cards", href: "/" },
      { label: "Open settings", href: "/settings" },
    ],
  },
  "/settings": {
    title: "Settings",
    description: "Quick links for your workspace preferences.",
    actions: [
      { label: "Back to cards", href: "/", tone: "primary" },
      { label: "Create a card", href: "/create" },
      { label: "LINE service", href: "/line" },
    ],
  },
};

function getContext(pathname: string) {
  return pageCopy[Object.keys(pageCopy).find((key) => pathname === key || (key !== "/" && pathname.startsWith(key))) || "/"];
}

export default function RightContext() {
  const pathname = usePathname();
  const context = getContext(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setOpen(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const panel = (
    <aside className="flex h-full w-full flex-col gap-6 p-5" aria-label="Context actions">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Context</p>
          <h2 className="text-base font-bold text-[var(--foreground)]">{context.title}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{context.description}</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] lg:hidden" aria-label="Close context panel">
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {context.actions.map((action) => {
          const className = `flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 text-left text-xs font-semibold transition ${action.tone === "primary" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_4px_14px_rgba(255,32,86,0.2)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--input)]"}`;
          const content = <><span className="truncate">{action.label}</span><HugeiconsIcon icon={ArrowRight01Icon} size={15} /></>;
          if (action.href) return <Link key={action.label} href={action.href} onClick={() => setOpen(false)} className={className}>{content}</Link>;
          return <button key={action.label} type="button" onClick={() => { if (action.event) window.dispatchEvent(new CustomEvent("crtl:context-action", { detail: action.event })); action.onClick?.(); }} className={className}>{content}</button>;
        })}
      </div>

      <div className="mt-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3.5">
        <p className="text-[11px] font-semibold text-[var(--foreground)]">Keyboard friendly</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted-foreground)]">Use Tab to move through actions and Enter to open them.</p>
      </div>
    </aside>
  );

  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} className="fixed right-3 top-14 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-md transition hover:text-[var(--foreground)] lg:right-[300px]" aria-label={open ? "Close context actions" : "Open context actions"} aria-expanded={open}>
      <HugeiconsIcon icon={Settings01Icon} size={18} />
    </button>
    {open && <div className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    <div className={`fixed bottom-3 right-3 top-14 z-[65] w-[min(86vw,20rem)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[0_18px_50px_rgba(0,0,0,0.2)] transition-transform duration-200 lg:bottom-4 lg:right-4 lg:top-16 lg:w-64 ${open ? "translate-x-0" : "translate-x-[calc(100%+1rem)] lg:translate-x-0 lg:opacity-0 lg:pointer-events-none"}`}>
      {panel}
    </div>
  </>;
}
