export function splitLineCardImagePaths(startImages: string[], savedPaths: string[]): { startImages: string[]; images: string[] } {
  return {
    startImages: savedPaths.slice(0, startImages.length),
    images: savedPaths.slice(startImages.length),
  };
}
