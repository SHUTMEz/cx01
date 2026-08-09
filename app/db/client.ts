import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { schema } from "./schema";

let databasePromise: Promise<Database> | null = null;
let drizzleDatabase: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getNativeDatabase(): Promise<Database> {
  databasePromise ??= Database.load("sqlite:crtl.db");
  return databasePromise;
}

export async function getDatabase() {
  if (!drizzleDatabase) {
    const nativeDatabase = await getNativeDatabase();
    drizzleDatabase = drizzle(async (sql, params, method) => {
      if (method === "run") {
        await nativeDatabase.execute(sql, params);
        return { rows: [] };
      }
      const result = await nativeDatabase.select<Record<string, unknown>[]>(sql, params);
      return { rows: result.map((row) => Object.values(row)) };
    }, { schema });
  }

  return drizzleDatabase;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getNativeDatabase();
  const statements = [
    `
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Other',
      created_at INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      exported_path TEXT,
      count INTEGER NOT NULL DEFAULT 0
    )
    `,
    `CREATE TABLE IF NOT EXISTS card_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      is_start INTEGER NOT NULL DEFAULT 0,
      src TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS cards_created_at_idx ON cards(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS card_images_card_id_idx ON card_images(card_id, sort_order)`,
  ];
  for (const statement of statements) await database.execute(statement);
  try {
    await database.execute("ALTER TABLE cards ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Existing databases already have the column.
  }
  await database.execute("UPDATE cards SET sort_order = created_at WHERE sort_order = 0");
}
