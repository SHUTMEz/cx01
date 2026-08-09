"use client";

import { useEffect } from "react";
import { useStore } from "../store/useStore";

export default function AppBootstrap() {
  const initialize = useStore((state) => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);
  return null;
}
