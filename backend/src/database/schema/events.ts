import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { games } from "./games";
import { locations } from "./locations";

export const eventCategoryEnum = pgEnum("event_category", [
  "strategy",
  "rpg",
  "party",
  "classic",
  "cooperative",
  "trivia",
  "miniatures",
  "family",
  "other",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    gameId: uuid("game_id").references(() => games.id, {
      onDelete: "set null",
    }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    maxPlayers: integer("max_players"),
    description: text("description"),
    color: text("color"),
    coverImage: text("cover_image"),
    category: eventCategoryEnum("category"),
    createdBy: text("created_by").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("events_created_by_idx").on(table.createdBy),
    index("events_start_time_idx").on(table.startTime),
    index("events_location_id_idx").on(table.locationId),
  ]
);

export type SelectEvent = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
