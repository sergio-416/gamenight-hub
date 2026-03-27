import type { SelectGame } from '@database/schema/games.js';

export type GameResponse = Omit<SelectGame, 'createdBy' | 'updatedAt' | 'deletedAt'>;

export function toGameResponse(game: SelectGame): GameResponse {
	const { createdBy, updatedAt, deletedAt, ...response } = game;
	return response;
}

export type EnrichedGameResponse = GameResponse & {
	bggRating: number | null;
	bggRank: number | null;
	recommendations?: GameResponse[];
};

export function toEnrichedGameResponse(
	game: SelectGame & { bggRating: number | null; bggRank: number | null },
	recommendations?: SelectGame[],
): EnrichedGameResponse {
	const { createdBy, updatedAt, deletedAt, ...response } = game;
	return {
		...response,
		recommendations: recommendations?.map(toGameResponse),
	};
}
