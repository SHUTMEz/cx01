"use client";

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "../store/useStore";
import LineCaptureModal from "../line/LineCaptureModal";

export default function AppBootstrap() {
  const initialize = useStore((state) => state.initialize);
  const updateLineService = useStore((state) => state.updateLineService);
  const receiveLineImage = useStore((state) => state.receiveLineImage);
  const receiveLineText = useStore((state) => state.receiveLineText);
  useEffect(() => {
    void initialize();
    let active = true;
    const subscription = listen<{ event_type: string; payload: Record<string, string> }>("line-service-event", (event) => {
      if (!active) return;
      const { event_type: eventType, payload } = event.payload;
      if (eventType === "connected") updateLineService({ accountId: payload.accountId, accountName: payload.accountName, status: "ready", message: "Ready to start" });
      if (eventType === "status" && payload.status === "connecting") updateLineService({ status: "connecting", message: "Connecting to LINE" });
      if (eventType === "status" && payload.status === "running") updateLineService({ status: "running", message: "Waiting for incoming data" });
      if (eventType === "status" && payload.status === "ready") updateLineService({ status: "ready", message: "Ready to start" });
      if (eventType === "stopped") updateLineService({ status: "stopped", message: "Service is stopped" });
      if (eventType === "error") updateLineService({ status: "stopped", message: payload.message || "LINE service error" });
      if (eventType === "image") receiveLineImage(`data:${payload.mimeType};base64,${payload.data}`);
      if (eventType === "text") receiveLineText(payload.text);
    });
    return () => { active = false; void subscription.then((remove) => remove()); };
  }, [initialize, receiveLineImage, receiveLineText, updateLineService]);
  return <LineCaptureModal />;
}
