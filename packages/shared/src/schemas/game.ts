import { z } from 'zod';
import { GAME_CONSTRAINTS } from '../constants/validation.js';

export const GameStatusSchema = z.enum(['owned', 'want_to_play', 'want_to_try', 'played']);

export type GameStatus = z.infer<typeof GameStatusSchema>;

export const GameSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	bggId: z.number().int().positive().optional().nullable(),
	yearPublished: z.number().int().optional(),
	minPlayers: z.number().int().min(1).optional(),
	maxPlayers: z.number().int().min(1).optional(),
	playingTime: z.number().int().min(0).optional(),
	minAge: z.number().int().min(0).optional(),
	description: z.string().optional(),
	categories: z.array(z.string()).optional(),
	mechanics: z.array(z.string()).optional(),
	publisher: z.string().optional(),
	thumbnailUrl: z.url().optional().nullable(),
	imageUrl: z.url().optional().nullable(),
	status: GameStatusSchema.default('want_to_try'),
	notes: z.string().optional(),
	complexity: z
		.number()
		.int()
		.min(GAME_CONSTRAINTS.COMPLEXITY_MIN)
		.max(GAME_CONSTRAINTS.COMPLEXITY_MAX)
		.optional(),
	isExpansion: z.boolean().optional(),
	createdBy: z.string().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

const WEIGHT_LABELS = {
	1: 'Light',
	2: 'Light-Medium',
	3: 'Medium',
	4: 'Medium-Heavy',
	5: 'Heavy',
} as const;

type WeightLabel = (typeof WEIGHT_LABELS)[keyof typeof WEIGHT_LABELS];

const EnrichedGameSchema = GameSchema.extend({
	bggRating: z.number().nullable().optional(),
	bggRank: z.number().int().nullable().optional(),
	recommendations: z.array(GameSchema).optional(),
});

type EnrichedGame = z.infer<typeof EnrichedGameSchema>;

export const CreateGameSchema = z.object({
	bggId: z.number().int().positive(),
	status: GameStatusSchema.optional(),
	notes: z.string().optional(),
	complexity: z
		.number()
		.int()
		.min(GAME_CONSTRAINTS.COMPLEXITY_MIN)
		.max(GAME_CONSTRAINTS.COMPLEXITY_MAX)
		.optional(),
});

export const UpdateGameSchema = z.object({
	status: GameStatusSchema.optional(),
	notes: z.string().optional(),
	complexity: z
		.number()
		.int()
		.min(GAME_CONSTRAINTS.COMPLEXITY_MIN)
		.max(GAME_CONSTRAINTS.COMPLEXITY_MAX)
		.optional(),
});

export type Game = z.infer<typeof GameSchema>;
export type CreateGame = z.infer<typeof CreateGameSchema>;
export type UpdateGame = z.infer<typeof UpdateGameSchema>;

export const UserPlayedGameSchema = z.object({
	id: z.uuid(),
	userId: z.string(),
	gameId: z.uuid(),
	playedAt: z.coerce.date(),
	createdAt: z.coerce.date(),
});

export const CreatePlayedGameSchema = z.object({
	gameId: z.uuid(),
});

export const CheckPlayedGameResponseSchema = z.object({
	played: z.boolean(),
	playedAt: z.date().nullable(),
});

export type UserPlayedGame = z.infer<typeof UserPlayedGameSchema>;
export type CreatePlayedGame = z.infer<typeof CreatePlayedGameSchema>;
export type CheckPlayedGameResponse = z.infer<typeof CheckPlayedGameResponseSchema>;

export type { EnrichedGame, WeightLabel };
export { EnrichedGameSchema, WEIGHT_LABELS };
