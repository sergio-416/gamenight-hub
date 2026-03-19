import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userPlayedGames = pgTable(
  "user_played_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    gameId: uuid("game_id").notNull(),
    playedAt: timestamp("played_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_played_games_user_game_idx").on(
      table.userId,
      table.gameId
    ),
    index("user_played_games_user_id_idx").on(table.userId),
    index("user_played_games_game_id_idx").on(table.gameId),
  ]
);

export type SelectUserPlayedGame = typeof userPlayedGames.$inferSelect;
export type InsertUserPlayedGame = typeof userPlayedGames.$inferInsert;
