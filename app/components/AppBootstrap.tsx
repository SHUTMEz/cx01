"use client";

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import LineCaptureModal from "../line/LineCaptureModal";

export default function AppBootstrap() {
  const initialize = useStore((state) => state.initialize);
  const updateLineService = useStore((state) => state.updateLineService);
  const receiveLineCaptureEvent = useStore((state) => state.receiveLineCaptureEvent);
  const clearLineCaptureQueue = useStore((state) => state.clearLineCaptureQueue);
  useEffect(() => {
    void initialize();
    let active = true;
    const subscription = listen<{ event_type: string; payload: Record<string, string | number> }>("line-service-event", (event) => {
      if (!active) return;
      const { event_type: eventType, payload } = event.payload;
      const receivedAt = Number(payload.receivedAt) || Date.now();
      const messageId = String(payload.messageId || `legacy-${receivedAt}`);
      const chatId = String(payload.chatId || "default");
      const sequence = Number(payload.sequence) || receivedAt;
      const captureMeta = { messageId, chatId, sequence, receivedAt };
      if (eventType === "connected") updateLineService({ accountId: String(payload.accountId), accountName: String(payload.accountName), status: "ready", message: "Ready to start" });
      if (eventType === "status" && payload.status === "connecting") updateLineService({ status: "connecting", message: "Connecting to LINE" });
      if (eventType === "status" && payload.status === "running") updateLineService({ status: "running", message: "Waiting for incoming data" });
      if (eventType === "status" && payload.status === "ready") updateLineService({ status: "ready", message: "Ready to start" });
      if (eventType === "reconnecting") {
        updateLineService({ status: "reconnecting", message: String(payload.message || "Reconnecting to LINE") });
        toast.warning("LINE connection interrupted. Reconnecting…", { id: "line-reconnecting" });
      }
      if (eventType === "stopped") {
        updateLineService({ status: "stopped", message: "Service is stopped" });
        clearLineCaptureQueue();
      }
      if (eventType === "error") {
        const message = String(payload.message || "LINE service error");
        updateLineService({ status: "stopped", message });
        toast.error(message, { id: "line-service-error" });
      }
      if (eventType === "image-pending") {
        const notice = receiveLineCaptureEvent({ type: "image-pending", ...captureMeta });
        if (notice?.type === "queue-full") toast.warning("Capture queue is full", { id: "line-capture-full" });
      }
      if (eventType === "image-loaded" || eventType === "image") {
        const notice = receiveLineCaptureEvent({
          type: "image-loaded",
          ...captureMeta,
          dataUrl: `data:${payload.mimeType};base64,${payload.data}`,
        });
        if (notice?.type === "queue-full") toast.warning("Capture queue is full", { id: "line-capture-full" });
      }
      if (eventType === "image-error") {
        receiveLineCaptureEvent({ type: "image-error", ...captureMeta });
        toast.warning("One photo could not be loaded", { id: `line-image-error-${messageId}` });
      }
      if (eventType === "text") {
        const notice = receiveLineCaptureEvent({ type: "text", ...captureMeta, text: String(payload.text || "") });
        if (notice?.type === "queue-full") toast.warning("Capture queue is full", { id: "line-capture-full" });
      }
    });
    return () => { active = false; void subscription.then((remove) => remove()); };
  }, [clearLineCaptureQueue, initialize, receiveLineCaptureEvent, updateLineService]);
  return <LineCaptureModal />;
}
