import { index, integer, pgEnum, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const venueTypeEnum = pgEnum('venue_type', [
	'cafe',
	'store',
	'home',
	'public_space',
	'other',
]);

export const locations = pgTable(
	'locations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		latitude: real('latitude').notNull(),
		longitude: real('longitude').notNull(),
		address: text('address'),
		postalCode: text('postal_code'),
		venueType: venueTypeEnum('venue_type'),
		capacity: integer('capacity'),
		amenities: text('amenities').array(),
		description: text('description'),
		hostName: text('host_name'),
		createdBy: text('created_by').notNull(),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('locations_created_by_idx').on(table.createdBy),
		index('locations_coords_idx').on(table.latitude, table.longitude),
	],
);

export type SelectLocation = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
