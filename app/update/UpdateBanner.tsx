"use client";

import { useState } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, Refresh01Icon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { isAllowedUpdateUrl, selectWindowsInstaller } from "./updateService";
import { useUpdateCheck } from "./useUpdateCheck";

export default function UpdateBanner() {
  const { state, result, check, currentVersion } = useUpdateCheck();
  const [opening, setOpening] = useState(false);
  const release = result?.release || null;
  const installer = selectWindowsInstaller(release);

  const updateNow = async () => {
    if (!installer || !isAllowedUpdateUrl(installer) || opening) return;
    if (!window.confirm(`Update CRTL from v${currentVersion} to v${release?.version}?`)) return;
    setOpening(true);
    try {
      await open(installer);
      toast.success("Installer opened");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open installer");
    } finally {
      setOpening(false);
    }
  };

  if (state === "idle") return null;
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"><HugeiconsIcon icon={state === "checking" ? Refresh01Icon : Download01Icon} size={17} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--foreground)]">{state === "checking" ? "Checking for updates…" : state === "available" ? `Update available: v${release?.version}` : state === "up-to-date" ? "You’re up to date" : "Unable to check for updates"}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{state === "available" ? (release?.notes.split("\n").filter(Boolean).slice(0, 3).join(" ") || "A newer version is ready.") : state === "error" ? (result?.message || "Check your connection and try again.") : `Current version v${currentVersion}`}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state === "available" && installer && <button type="button" onClick={() => void updateNow()} disabled={opening} className="min-h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-3 text-xs font-bold text-[var(--primary-foreground)] disabled:opacity-60">{opening ? "Opening…" : "Update now"}</button>}
            {(state === "error" || state === "up-to-date") && <button type="button" onClick={() => void check()} className="min-h-10 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs font-semibold text-[var(--foreground)]">Check again</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
