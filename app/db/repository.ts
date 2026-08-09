import { asc, desc, eq } from "drizzle-orm";
import { get } from "idb-keyval";
import { Card, Settings } from "../types";
import { getDatabase, getNativeDatabase, initializeDatabase } from "./client";
import { cardImages, cards } from "./schema";
import { saveCardImages } from "../utils/imageStorage";

const defaultSettings: Settings = {
  endText: "",
  startPhotos: [],
  useEndText: true,
  exportPath: null,
  theme: "light",
  categories: [],
};

type LegacyState = { state?: { cards?: Card[]; settings?: Settings; machineId?: string; license?: Card["exportedPath"] } };

export async function loadCards(): Promise<Card[]> {
  const database = await getDatabase();
  const rows = await database.select().from(cards).orderBy(desc(cards.sortOrder));
  const images = await database.select().from(cardImages).orderBy(asc(cardImages.sortOrder));
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    category: row.category,
    createdAt: row.createdAt,
    sortOrder: row.sortOrder,
    exportedPath: row.exportedPath ?? undefined,
    count: row.count,
    images: images.filter((image) => image.cardId === row.id && image.isStart === 0).map((image) => image.src),
    startImages: images.filter((image) => image.cardId === row.id && image.isStart === 1).map((image) => image.src),
  }));
}

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const database = await getNativeDatabase();
  const rows = await database.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", [key]);
  const value = rows[0]?.value;
  if (value === undefined) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

async function setSetting(key: string, value: unknown): Promise<void> {
  const database = await getNativeDatabase();
  await database.execute(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, JSON.stringify(value)],
  );
}

export async function loadSettings(): Promise<Settings> {
  return {
    endText: await getSetting("endText", defaultSettings.endText),
    startPhotos: await getSetting("startPhotos", defaultSettings.startPhotos),
    useEndText: await getSetting("useEndText", defaultSettings.useEndText),
    exportPath: await getSetting("exportPath", defaultSettings.exportPath),
    theme: await getSetting("theme", defaultSettings.theme),
    categories: await getSetting("categories", defaultSettings.categories),
    viewMode: await getSetting("viewMode", defaultSettings.viewMode),
  };
}

export async function saveSettings(value: Settings): Promise<void> {
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) await setSetting(key, item);
  }
}

export async function getPersistentValue<T>(key: string, fallback: T): Promise<T> {
  return getSetting(key, fallback);
}

export async function setPersistentValue(key: string, value: unknown): Promise<void> {
  await setSetting(key, value);
}

export async function saveCard(card: Card): Promise<void> {
  const database = await getDatabase();
  await database.insert(cards).values({
    id: card.id, text: card.text, category: card.category, createdAt: card.createdAt,
    sortOrder: card.sortOrder ?? card.createdAt,
    exportedPath: card.exportedPath ?? null, count: card.count ?? 0,
  }).onConflictDoUpdate({ target: cards.id, set: {
    text: card.text, category: card.category, sortOrder: card.sortOrder ?? card.createdAt,
    exportedPath: card.exportedPath ?? null, count: card.count ?? 0,
  }});
  await database.delete(cardImages).where(eq(cardImages.cardId, card.id));
  const imageRows = [
    ...(card.startImages ?? []).map((src, sortOrder) => ({ cardId: card.id, sortOrder, src, isStart: 1 })),
    ...card.images.map((src, sortOrder) => ({ cardId: card.id, sortOrder, src, isStart: 0 })),
  ];
  if (imageRows.length) await database.insert(cardImages).values(imageRows);
}

export async function removeCard(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete(cardImages).where(eq(cardImages.cardId, id));
  await database.delete(cards).where(eq(cards.id, id));
}

export async function clearCards(ids?: string[]): Promise<void> {
  const current = await loadCards();
  await Promise.all((ids ?? current.map((card) => card.id)).map(removeCard));
}

export async function migrateCardImageFiles(): Promise<void> {
  const current = await loadCards();
  for (const card of current) {
    const startImages = card.startImages ?? [];
    const images = card.images ?? [];
    const allImages = [...startImages, ...images];
    if (!allImages.length || !allImages.some((src) => src.startsWith("data:"))) continue;

    try {
      const savedPaths = await saveCardImages(card.id, allImages);
      await saveCard({
        ...card,
        startImages: savedPaths.slice(0, startImages.length),
        images: savedPaths.slice(startImages.length),
      });
    } catch (error) {
      console.error("Failed to migrate card images", card.id, error);
    }
  }
}

export async function migrateLegacyStorage(): Promise<void> {
  if (await getSetting("legacyMigrationDone", false)) return;

  const database = await getDatabase();
  const existing = await database.select({ id: cards.id }).from(cards).limit(1);
  if (existing.length) {
    await setSetting("legacyMigrationDone", true);
    return;
  }
  const rawLegacy = await get<string>("crtl-storage");
  let legacy: LegacyState | null = null;
  try { legacy = rawLegacy ? JSON.parse(rawLegacy) as LegacyState : null; } catch { legacy = null; }
  const state = legacy?.state;
  if (state) {
    for (const card of state.cards ?? []) await saveCard(card);
    await saveSettings({ ...defaultSettings, ...(state.settings ?? {}) });
  }
  await setSetting("legacyMigrationDone", true);
}

export { defaultSettings, initializeDatabase };
