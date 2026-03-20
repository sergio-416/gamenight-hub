import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core";

export const bggGames = pgTable(
  "bgg_games",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    rank: integer("rank"),
    avgRating: numeric("avg_rating", { precision: 5, scale: 2 }),
    yearPublished: integer("year_published"),
    geekRating: numeric("geek_rating", { precision: 5, scale: 2 }),
    isExpansion: boolean("is_expansion").notNull().default(false),
  },
  (table) => [index("bgg_games_name_idx").on(table.name)]
);

export type SelectBggGame = typeof bggGames.$inferSelect;
export type InsertBggGame = typeof bggGames.$inferInsert;
