export function addStartImage(images: string[], selected: string[], image: string): { images: string[]; selected: string[] } {
  const nextImages = images.includes(image) ? images : [...images, image];
  const nextSelected = selected.includes(image) ? selected : [...selected, image];
  return { images: nextImages, selected: nextSelected };
}

export function getDefaultStartImages(settingsImages: string[], savedImages?: string[]): string[] {
  return savedImages && savedImages.length > 0 ? savedImages : settingsImages;
}
