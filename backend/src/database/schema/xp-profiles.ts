import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';

export const xpActionEnum = pgEnum('xp_action', [
	'game_added',
	'event_created',
	'participant_joined',
]);

export const xpProfiles = pgTable(
	'xp_profiles',
	{
		userId: t
			.text('user_id')
			.primaryKey()
			.references(() => profiles.uid, { onDelete: 'cascade' }),
		xpTotal: t.integer('xp_total').notNull().default(0),
		level: t.integer('level').notNull().default(1),
		streakWeeks: t.integer('streak_weeks').notNull().default(0),
		lastActivityAt: t.timestamp('last_activity_at'),
		monthlyGameAdds: t.integer('monthly_game_adds').notNull().default(0),
		monthlyGameAddsResetAt: t.timestamp('monthly_game_adds_reset_at').defaultNow().notNull(),
		createdAt: t.timestamp('created_at').defaultNow().notNull(),
		updatedAt: t.timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [t.index('xp_profiles_level_idx').on(table.level)],
);

export type SelectXpProfile = typeof xpProfiles.$inferSelect;
export type InsertXpProfile = typeof xpProfiles.$inferInsert;
