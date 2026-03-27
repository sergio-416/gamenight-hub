import { z } from 'zod';
import { GAME_CONSTRAINTS, GEO } from '../constants/validation.js';
import { VenueTypeSchema } from './location.js';

export const EVENT_COLOR_TOKENS = ['emerald', 'amber', 'rose', 'sky', 'violet', 'slate'] as const;

export const EventColorSchema = z.enum(EVENT_COLOR_TOKENS);

export type EventColor = z.infer<typeof EventColorSchema>;

export const EVENT_CATEGORIES = [
	'strategy',
	'rpg',
	'party',
	'classic',
	'cooperative',
	'trivia',
	'miniatures',
	'family',
	'other',
] as const;

export const EventCategorySchema = z.enum(EVENT_CATEGORIES);

export type EventCategory = z.infer<typeof EventCategorySchema>;

export const CalendarEventSchema = z.object({
	id: z.uuid(),
	title: z.string().min(1),
	gameId: z.uuid().optional(),
	locationId: z.uuid(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date().optional(),
	maxPlayers: z.number().int().min(1).max(GAME_CONSTRAINTS.MAX_PLAYERS_LIMIT).optional(),
	description: z.string().optional(),
	color: EventColorSchema.optional(),
	coverImage: z.string().optional(),
	category: EventCategorySchema.optional(),
	venueType: VenueTypeSchema.optional(),
	gameThumbnailUrl: z.string().url().optional(),
	gameImageUrl: z.string().url().optional(),
	gameName: z.string().nullable().optional(),
	gameComplexity: z.number().nullable().optional(),
	gamePlayingTime: z.number().nullable().optional(),
	gameMinPlayers: z.number().nullable().optional(),
	gameMaxPlayers: z.number().nullable().optional(),
	hostUsername: z.string().nullable().optional(),
	hostAvatar: z.string().nullable().optional(),
	createdBy: z.string().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

export const InlineLocationSchema = z.object({
	name: z.string().min(1),
	venueType: VenueTypeSchema.optional(),
	address: z.string().optional(),
	postalCode: z.string().optional(),
	latitude: z.number().min(GEO.LAT_MIN).max(GEO.LAT_MAX),
	longitude: z.number().min(GEO.LON_MIN).max(GEO.LON_MAX),
});

const CreateCalendarEventBaseSchema = z.object({
	title: z.string().min(1),
	gameId: z.uuid().optional(),
	locationId: z.uuid().optional(),
	location: InlineLocationSchema.optional(),
	startTime: z.iso.datetime({ offset: true }),
	endTime: z.iso.datetime({ offset: true }).optional(),
	maxPlayers: z
		.number()
		.int()
		.min(GAME_CONSTRAINTS.MIN_PLAYERS_EVENT)
		.max(GAME_CONSTRAINTS.MAX_PLAYERS_LIMIT),
	description: z.string().optional(),
	color: EventColorSchema.optional(),
	coverImage: z.string().min(1).max(GAME_CONSTRAINTS.COVER_IMAGE_MAX_LENGTH).optional(),
	category: EventCategorySchema.optional(),
});

export const CreateCalendarEventSchema = CreateCalendarEventBaseSchema.refine(
	(data) => data.locationId !== undefined || data.location !== undefined,
	{
		message: 'Either locationId or an inline location must be provided',
		path: ['location'],
	},
);

export const UpdateCalendarEventSchema = CreateCalendarEventBaseSchema.partial();

export const EventTimeFilterSchema = z.object({
	from: z.iso.datetime({ offset: true }).optional(),
	to: z.iso.datetime({ offset: true }).optional(),
	category: EventCategorySchema.optional(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CreateCalendarEvent = z.infer<typeof CreateCalendarEventSchema>;
export type UpdateCalendarEvent = z.infer<typeof UpdateCalendarEventSchema>;
export type InlineLocation = z.infer<typeof InlineLocationSchema>;
export type EventTimeFilter = z.infer<typeof EventTimeFilterSchema>;
