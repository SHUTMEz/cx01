import { create } from "zustand";
import { Card, Settings } from "../types";
import {
  initialCaptureState,
  lineCaptureReducer,
  LineCaptureAction,
  LineCaptureState,
  LINE_PENDING_TEXT_TTL_MS,
} from "../line/captureState";
import { LineServiceStatus } from "../line/serviceState";
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

let settingsWriteQueue: Promise<void> = Promise.resolve();

interface AppState {
  cards: Card[];
  settings: Settings;
  ready: boolean;
  lineService: { accountId: string | null; accountName: string | null; status: LineServiceStatus; message: string };
  lineCapture: LineCaptureState;
  initialize: () => Promise<void>;
  addCard: (card: Card) => Promise<void>;
  updateCard: (id: string, card: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCards: (ids: string[]) => Promise<void>;
  clearAllCards: () => Promise<void>;
  moveCardToBottom: (id: string, direction?: "asc" | "desc") => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateLineService: (value: Partial<AppState["lineService"]>) => void;
  receiveLineCaptureEvent: (event: LineCaptureAction) => LineCaptureState["notice"];
  copyLineImage: (index: number) => void;
  discardActiveLineCapture: () => void;
  completeLineCapture: (id: string) => void;
  clearLineCaptureQueue: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  cards: [],
  settings: defaultSettings,
  ready: false,
  lineService: { accountId: null, accountName: null, status: "disconnected", message: "Connect a LINE account to start" },
  lineCapture: initialCaptureState,
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
    // Update the UI immediately, then serialize writes so rapid typing/clicks
    // cannot race and overwrite newer settings with an older snapshot.
    set({ settings });
    const write = settingsWriteQueue.then(() => saveSettings(settings));
    settingsWriteQueue = write.catch((error) => {
      console.error("Failed to persist settings", error);
    });
    await write;
  },
  updateLineService: (value) => set((state) => ({ lineService: { ...state.lineService, ...value } })),
  receiveLineCaptureEvent: (event) => {
    const next = lineCaptureReducer(get().lineCapture, event);
    set({ lineCapture: next });
    if (event.type === "text") {
      window.setTimeout(() => {
        set((state) => ({ lineCapture: lineCaptureReducer(state.lineCapture, { type: "expire", now: Date.now() }) }));
      }, LINE_PENDING_TEXT_TTL_MS + 50);
    }
    return next.notice;
  },
  copyLineImage: (index) => set((state) => ({ lineCapture: lineCaptureReducer(state.lineCapture, { type: "copy-image", index }) })),
  discardActiveLineCapture: () => set((state) => ({ lineCapture: lineCaptureReducer(state.lineCapture, { type: "discard-active" }) })),
  completeLineCapture: (id) => set((state) => ({ lineCapture: lineCaptureReducer(state.lineCapture, { type: "complete-capture", id }) })),
  clearLineCaptureQueue: () => set((state) => ({
    lineCapture: lineCaptureReducer(state.lineCapture, { type: "clear-queue" }),
  })),
}));
