export type {
	EnrichedGame,
	Game,
	GameStatus,
	WeightLabel,
} from "@gamenight-hub/shared";
export { WEIGHT_LABELS } from "@gamenight-hub/shared";

export interface GameSearchResult {
	bggId: number;
	name: string;
	yearPublished?: number;
	rank?: string;
	avgRating?: string;
	isExpansion?: boolean;
	source: "local" | "bgg";
}

export interface BggGameDetail {
	bggId: number;
	name: string;
	yearPublished?: number;
	minPlayers?: number;
	maxPlayers?: number;
	playingTime?: number;
	minAge?: number;
	description?: string;
	categories: string[];
	mechanics: string[];
	publisher?: string;
	thumbnailUrl?: string;
	imageUrl?: string;
	isExpansion?: boolean;
}

export interface PersonalFields {
	status?: "owned" | "want_to_play" | "want_to_try" | "played";
	notes?: string;
	complexity?: number;
}
