import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { xpActionEnum } from "./xp-profiles.js";

export const xpTransactions = pgTable(
  "xp_transactions",
  {
    id: t.uuid("id").primaryKey().defaultRandom(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => profiles.uid, { onDelete: "cascade" }),
    action: xpActionEnum("action").notNull(),
    baseXp: t.integer("base_xp").notNull(),
    multiplier: t
      .numeric("multiplier", { precision: 5, scale: 4 })
      .notNull()
      .default("1.0000"),
    finalXp: t.integer("final_xp").notNull(),
    metadata: t.jsonb("metadata").notNull().default({}),
    dailyActionTotal: t.integer("daily_action_total").notNull(),
    dailyGrandTotal: t.integer("daily_grand_total").notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    t
      .index("xp_transactions_user_created_idx")
      .on(table.userId, table.createdAt),
    t
      .index("xp_transactions_user_action_created_idx")
      .on(table.userId, table.action, table.createdAt),
  ]
);

export type SelectXpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = typeof xpTransactions.$inferInsert;
