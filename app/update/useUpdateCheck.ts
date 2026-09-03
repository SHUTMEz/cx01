"use client";

import { useCallback, useEffect, useState } from "react";
import packageJson from "../../package.json";
import { checkForUpdate, UpdateCheckResult } from "./updateService";

export type UpdateCheckState = "idle" | "checking" | "available" | "up-to-date" | "error";

export function useUpdateCheck() {
  const [state, setState] = useState<UpdateCheckState>("idle");
  const [result, setResult] = useState<UpdateCheckResult | null>(null);

  const check = useCallback(async () => {
    setState("checking");
    const next = await checkForUpdate(packageJson.version);
    setResult(next);
    setState(next.status);
    return next;
  }, []);

  useEffect(() => {
    void check();
    const listener = (event: Event) => {
      if (event.type === "crtl:check-for-updates") void check();
    };
    window.addEventListener("crtl:check-for-updates", listener);
    return () => {
      window.removeEventListener("crtl:check-for-updates", listener);
    };
  }, [check]);

  return { state, result, check, currentVersion: packageJson.version };
}
