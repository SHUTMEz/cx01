"use client";

import { useEffect } from "react";

export function ThemeProvider() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
