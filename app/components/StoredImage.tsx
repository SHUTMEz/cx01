"use client";

import { useEffect, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { getImageSrc } from "../utils/imageStorage";

interface StoredImageProps {
  src: string;
  alt?: string;
  className?: string;
}

function mimeFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/png";
}

export default function StoredImage({ src, alt = "", className }: StoredImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src.startsWith("data:") ? src : "");

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    if (src.startsWith("data:")) {
      setDisplaySrc(src);
      return () => undefined;
    }

    void readFile(src)
      .then((bytes) => {
        if (!active) return;
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeFromPath(src) });
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
      })
      .catch(() => {
        if (active) setDisplaySrc(getImageSrc(src));
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!displaySrc) return null;
  return <img src={displaySrc} alt={alt} className={className} />;
}
