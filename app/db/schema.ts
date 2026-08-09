import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  text: text("text").notNull().default(""),
  category: text("category").notNull().default("Other"),
  createdAt: integer("created_at").notNull(),
  exportedPath: text("exported_path"),
  count: integer("count").notNull().default(0),
});

export const cardImages = sqliteTable("card_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull(),
  sortOrder: integer("sort_order").notNull(),
  isStart: integer("is_start").notNull().default(0),
  src: text("src").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const schema = { cards, cardImages, settings };
