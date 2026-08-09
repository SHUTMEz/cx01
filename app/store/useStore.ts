import { create } from "zustand";
import { Card, Settings } from "../types";
import {
  clearCards,
  defaultSettings,
  initializeDatabase,
  loadCards,
  loadSettings,
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
  moveCardToBottom: (id: string) => Promise<void>;
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
    set({ cards: await loadCards(), settings: await loadSettings(), ready: true });
  },
  addCard: async (card) => {
    await saveCard(card);
    set((state) => ({ cards: [card, ...state.cards] }));
  },
  updateCard: async (id, updatedCard) => {
    const card = get().cards.find((item) => item.id === id);
    if (!card) return;
    const updated = { ...card, ...updatedCard };
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
  moveCardToBottom: async (id) => {
    const index = get().cards.findIndex((card) => card.id === id);
    if (index < 0) return;
    const cards = [...get().cards];
    const [card] = cards.splice(index, 1);
    cards.push(card);
    set({ cards });
  },
  updateSettings: async (value) => {
    const settings = { ...get().settings, ...value };
    await saveSettings(settings);
    set({ settings });
  },
}));
