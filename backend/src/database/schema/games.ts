import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("game_status", [
  "owned",
  "want_to_play",
  "want_to_try",
  "played",
]);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    bggId: integer("bgg_id"),
    yearPublished: integer("year_published"),
    minPlayers: integer("min_players"),
    maxPlayers: integer("max_players"),
    playingTime: integer("playing_time"),
    minAge: integer("min_age"),
    description: text("description"),
    categories: text("categories").array(),
    mechanics: text("mechanics").array(),
    publisher: text("publisher"),
    thumbnailUrl: text("thumbnail_url"),
    imageUrl: text("image_url"),
    status: gameStatusEnum("status").notNull().default("want_to_try"),
    notes: text("notes"),
    complexity: integer("complexity"),
    isExpansion: boolean("is_expansion").notNull().default(false),
    createdBy: text("created_by").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("games_created_by_idx").on(table.createdBy),
    index("games_bgg_id_idx").on(table.bggId),
    index("games_status_idx").on(table.status),
  ]
);

export type SelectGame = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
