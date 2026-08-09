import { create } from "zustand";
import { Card, Settings } from "../types";
import {
  clearCards,
  defaultSettings,
  initializeDatabase,
  loadCards,
  loadSettings,
  migrateCardImageFiles,
  migrateLegacyStorage,
  removeCard,
  saveCard,
  saveSettings,
} from "../db/repository";

interface AppState {
  cards: Card[];
  settings: Settings;
  ready: boolean;
  initialize: () => Promise<void>;
  addCard: (card: Card) => Promise<void>;
  updateCard: (id: string, card: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCards: (ids: string[]) => Promise<void>;
  clearAllCards: () => Promise<void>;
  moveCardToBottom: (id: string, direction?: "asc" | "desc") => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  cards: [],
  settings: defaultSettings,
  ready: false,
  initialize: async () => {
    if (get().ready) return;
    await initializeDatabase();
    await migrateLegacyStorage();
    await migrateCardImageFiles();
    set({ cards: await loadCards(), settings: await loadSettings(), ready: true });
  },
  addCard: async (card) => {
    const persisted = { ...card, sortOrder: card.sortOrder ?? card.createdAt };
    await saveCard(persisted);
    set((state) => ({ cards: [persisted, ...state.cards] }));
  },
  updateCard: async (id, updatedCard) => {
    const card = get().cards.find((item) => item.id === id);
    if (!card) return;
    const updated = { ...card, ...updatedCard, sortOrder: updatedCard.sortOrder ?? card.sortOrder ?? card.createdAt };
    await saveCard(updated);
    set((state) => ({ cards: state.cards.map((item) => item.id === id ? updated : item) }));
  },
  deleteCard: async (id) => {
    await removeCard(id);
    set((state) => ({ cards: state.cards.filter((card) => card.id !== id) }));
  },
  deleteCards: async (ids) => {
    await clearCards(ids);
    set((state) => ({ cards: state.cards.filter((card) => !ids.includes(card.id)) }));
  },
  clearAllCards: async () => {
    await clearCards();
    set({ cards: [] });
  },
  moveCardToBottom: async (id, direction = "desc") => {
    const current = get().cards;
    const card = current.find((item) => item.id === id);
    if (!card) return;
    const orders = current.map((item) => item.sortOrder ?? item.createdAt);
    const nextOrder = direction === "desc" ? Math.min(...orders) - 1 : Math.max(...orders) + 1;
    const updated = { ...card, sortOrder: nextOrder };
    await saveCard(updated);
    set((state) => ({ cards: state.cards.map((item) => item.id === id ? updated : item) }));
  },
  updateSettings: async (value) => {
    const settings = { ...get().settings, ...value };
    await saveSettings(settings);
    set({ settings });
  },
}));
