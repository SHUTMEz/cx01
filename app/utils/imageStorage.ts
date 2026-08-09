import { writeFile, mkdir, remove, exists, readDir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

const IMAGES_DIR = "card-images";

async function ensureImagesDir(cardId: string): Promise<string> {
  const baseDir = await appLocalDataDir();
  const cardDir = await join(baseDir, IMAGES_DIR, cardId);

  const dirExists = await exists(await join(IMAGES_DIR, cardId), {
    baseDir: BaseDirectory.AppLocalData,
  });

  if (!dirExists) {
    await mkdir(await join(IMAGES_DIR, cardId), {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
  }

  return cardDir;
}

function dataUrlToUint8Array(dataUrl: string): { data: Uint8Array; ext: string } {
  const arr = dataUrl.split(",");
  const match = arr[0].match(/:(.*?);/);
  const mime = match ? match[1] : "image/png";
  const ext = mime.split("/")[1] || "png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { data: u8arr, ext };
}

export async function saveCardImages(
  cardId: string,
  base64Images: string[]
): Promise<string[]> {
  await ensureImagesDir(cardId);
  const savedPaths: string[] = [];

  for (let i = 0; i < base64Images.length; i++) {
    const { data, ext } = dataUrlToUint8Array(base64Images[i]);
    const fileName = `${i + 1}.${ext}`;
    const relativePath = await join(IMAGES_DIR, cardId, fileName);

    await writeFile(relativePath, data, {
      baseDir: BaseDirectory.AppLocalData,
    });

    const baseDir = await appLocalDataDir();
    const fullPath = await join(baseDir, relativePath);
    savedPaths.push(fullPath);
  }

  return savedPaths;
}

export async function deleteCardImages(cardId: string): Promise<void> {
  const relativePath = await join(IMAGES_DIR, cardId);
  const dirExists = await exists(relativePath, {
    baseDir: BaseDirectory.AppLocalData,
  });

  if (dirExists) {
    await remove(relativePath, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
  }
}

export async function openCardFolder(cardId: string): Promise<void> {
  const baseDir = await appLocalDataDir();
  const folderPath = await join(baseDir, IMAGES_DIR, cardId);
  try {
    const folderExists = await exists(await join(IMAGES_DIR, cardId), {
      baseDir: BaseDirectory.AppLocalData,
    });
    if (folderExists) {
      await open(folderPath);
    }
  } catch (err) {
    console.error("Failed to open folder", err);
  }
}

export async function exportCardToFolder(
  exportPath: string,
  category: string,
  text: string,
  images: string[]
): Promise<{ savedPaths: string[], targetFolder: string }> {
  const timestamp = Date.now();
  const folderName = `${category}_${timestamp}`;
  const targetFolder = await join(exportPath, folderName);

  await mkdir(targetFolder, { recursive: true });

  const savedPaths: string[] = [];

  for (let i = 0; i < images.length; i++) {
    try {
      let src = images[i];
      if (!src.startsWith("data:") && !src.startsWith("http")) {
        src = convertFileSrc(src);
      }
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const u8arr = new Uint8Array(arrayBuffer);
      
      const mime = response.headers.get("content-type") || "image/png";
      const ext = mime.split("/")[1] || "png";
      
      const fileName = `${i + 1}.${ext}`;
      const fullPath = await join(targetFolder, fileName);
      
      await writeFile(fullPath, u8arr);
      savedPaths.push(fullPath);
    } catch (err) {
      console.error("Failed to export image", err);
    }
  }

  if (text) {
    const textPath = await join(targetFolder, "text.txt");
    const encoder = new TextEncoder();
    await writeFile(textPath, encoder.encode(text));
    savedPaths.push(textPath);
  }

  return { savedPaths, targetFolder };
}

export function getImageSrc(filePath: string): string {
  if (filePath.startsWith("data:")) {
    return filePath;
  }
  return convertFileSrc(filePath);
}

export async function deleteExportedFolder(folderPath: string): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_folder", { path: folderPath });
  } catch (err) {
    console.error("Failed to delete exported folder via Rust", err);
  }
}
