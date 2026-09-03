export function getCardImagePaths(images: string[], exportedPath?: string): string[] {
  const storedPaths = images.filter((src) => !src.startsWith("data:"));
  if (storedPaths.length === images.length) return storedPaths;
  if (!exportedPath) return storedPaths;
  return images.map((src, index) => {
    const match = src.match(/data:image\/([a-zA-Z]+);/);
    const ext = match ? match[1] : "jpeg";
    return `${exportedPath}\\${index + 1}.${ext}`;
  });
}

export function getCardImagesForDrag(startImages: string[] = [], images: string[] = []): string[] {
  return [...startImages, ...images];
}

export function getCardTextWithoutEndText(text: string): string {
  return text;
}
