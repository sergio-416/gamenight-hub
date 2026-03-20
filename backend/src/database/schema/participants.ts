import * as t from "drizzle-orm/pg-core";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { events } from "./events.js";
import { profiles } from "./profiles.js";

export const participantStatusEnum = pgEnum("participant_status", [
  "joined",
  "cancelled",
]);

export const participants = pgTable(
  "participants",
  {
    id: t.uuid("id").primaryKey().defaultRandom(),
    eventId: t
      .uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => profiles.uid, { onDelete: "cascade" }),
    status: participantStatusEnum("status").notNull().default("joined"),
    joinedAt: t.timestamp("joined_at").defaultNow().notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.unique("participants_event_user_unique").on(table.eventId, table.userId),
    t.index("participants_event_id_idx").on(table.eventId),
    t.index("participants_user_id_idx").on(table.userId),
  ]
);

export type SelectParticipant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;
