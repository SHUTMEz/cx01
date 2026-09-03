"use client";

import { useEffect, useReducer, useState } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, PlayIcon, StopIcon, UserCircleIcon, RefreshIcon } from "@hugeicons-pro/core-solid-rounded";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import QRCode from "qrcode";
import { initialLineServiceState, lineServiceReducer } from "./serviceState";
import { useStore } from "../store/useStore";

const statusLabels = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  ready: "Ready",
  running: "Running",
  stopped: "Stopped",
} as const;

export default function LineServicePage() {
  const [state, dispatch] = useReducer(lineServiceReducer, initialLineServiceState);
  const persistedService = useStore((store) => store.lineService);
  const updateLineService = useStore((store) => store.updateLineService);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [pincode, setPincode] = useState<string | null>(null);
  const isRunning = state.status === "running";

  useEffect(() => {
    if (persistedService.accountId) dispatch({ type: "connect", accountId: persistedService.accountId, accountName: persistedService.accountName || "LINE account" });
    if (persistedService.status === "running") dispatch({ type: "start" });
    if (persistedService.status === "stopped") dispatch({ type: "stop" });
  }, [persistedService.accountId, persistedService.accountName, persistedService.status]);

  useEffect(() => {
    let active = true;
    const unlisten = listen<{ event_type: string; payload: Record<string, string> }>("line-service-event", (event) => {
      if (!active) return;
      const { event_type: eventType, payload } = event.payload;
      if (eventType === "qr") {
        setQrUrl(payload.url);
        setPincode(null);
        void QRCode.toDataURL(payload.url, { width: 220, margin: 2 }).then(setQrImage).catch(() => setQrImage(null));
      }
      if (eventType === "pincode") setPincode(payload.pincode);
      if (eventType === "image") toast.success("Received image from LINE");
      if (eventType === "text") toast.success("Received text from LINE");
      if (eventType === "connected") {
        setQrUrl(null);
        setQrImage(null);
        setPincode(null);
        dispatch({ type: "connect", accountId: payload.accountId, accountName: payload.accountName });
        toast.success("LINE account connected");
      }
      if (eventType === "status" && payload.status === "running") dispatch({ type: "start" });
      if (eventType === "stopped") dispatch({ type: "stop" });
      if (eventType === "error") toast.error(payload.message);
    });
    return () => { active = false; void unlisten.then((remove) => remove()); };
  }, []);

  const handleLogin = async () => {
    dispatch({ type: "connecting" });
    updateLineService({ status: "connecting", message: "Waiting for LINE login" });
    try {
      await invoke("stop_line_service");
      await invoke("start_line_service");
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
  };

  const handleStart = () => {
    const next = lineServiceReducer(state, { type: "start" });
    if (next.status !== "running") { toast.error(next.message); return; }
    void invoke("start_line_listener").then(() => { toast.success("LINE Service started"); }).catch((error) => toast.error(error instanceof Error ? error.message : String(error)));
  };

  const handleStop = () => {
    void invoke("stop_line_service").then(() => { dispatch({ type: "stop" }); updateLineService({ status: "stopped", message: "Service is stopped" }); toast.success("LINE Service stopped"); }).catch((error) => toast.error(error instanceof Error ? error.message : String(error)));
  };

  useEffect(() => {
    const handleContextAction = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      if (action === "line:login") void handleLogin();
      if (action === "line:start") handleStart();
      if (action === "line:stop") handleStop();
    };
    window.addEventListener("crtl:context-action", handleContextAction);
    return () => window.removeEventListener("crtl:context-action", handleContextAction);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-full items-center justify-center py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_4px_14px_0_rgba(255,32,86,0.28)]">
            <HugeiconsIcon icon={Link01Icon} size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">LINE Service</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Connect and wait for incoming data.</p>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)]">
          {qrUrl && <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--surface)] p-3 text-xs text-[var(--muted-foreground)]"><p className="font-semibold text-[var(--foreground)]">Scan with LINE</p>{qrImage && <img src={qrImage} alt="LINE login QR code" className="mx-auto my-3 h-52 w-52 rounded bg-white p-2" />}<a href={qrUrl} target="_blank" rel="noreferrer" className="block break-all text-[var(--primary)] underline">Open QR login</a><button type="button" onClick={() => void navigator.clipboard.writeText(qrUrl)} className="mt-2 text-[var(--primary)]">Copy URL</button>{pincode && <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-center"><p className="font-semibold text-[var(--foreground)]">Enter this code in LINE</p><p className="my-2 text-2xl font-bold tracking-[0.3em] text-[var(--warning)]">{pincode}</p><button type="button" onClick={() => void navigator.clipboard.writeText(pincode)} className="text-[var(--warning)]">Copy code</button></div>}</div>}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--muted-foreground)]">
                <HugeiconsIcon icon={UserCircleIcon} size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{state.accountName || "LINE account"}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{state.accountId ? "Connected" : "Not connected"}</p>
              </div>
            </div>
            <button type="button" onClick={state.accountId ? () => dispatch({ type: "disconnect" }) : handleLogin} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] transition hover:brightness-125">
              <HugeiconsIcon icon={state.accountId ? RefreshIcon : Link01Icon} size={14} />
              {state.accountId ? "Change" : "Login"}
            </button>
          </div>

          <div className="flex items-center justify-between py-6">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{statusLabels[state.status]}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{state.message}</p>
            </div>
            <span className={`h-3 w-3 rounded-full ${isRunning ? "bg-[var(--success)] shadow-[0_0_0_5px_rgba(34,197,94,0.12)]" : "bg-[var(--muted-foreground)]/40"}`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleStart} disabled={isRunning || !state.accountId} className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              <HugeiconsIcon icon={PlayIcon} size={18} />Start
            </button>
            <button type="button" onClick={handleStop} disabled={!isRunning} className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-40">
              <HugeiconsIcon icon={StopIcon} size={18} />Stop
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--muted-foreground)]">{isRunning ? "Listening for incoming messages" : "Service is not listening"}</p>
      </section>
    </motion.div>
  );
}
