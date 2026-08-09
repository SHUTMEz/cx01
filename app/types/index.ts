export interface Card {
  id: string;
  images: string[];
  startImages?: string[];
  text: string;
  category: string;
  createdAt: number;
  exportedPath?: string;
  count?: number;
}

export interface Settings {
  endText: string;
  startPhotos: string[];
  useEndText: boolean;
  exportPath: string | null;
  theme?: "light" | "dark";
  categories?: string[];
  viewMode?: "card" | "table";
}
