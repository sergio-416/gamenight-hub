export const XP_CAPS = {
	ACTION_CAP: 500,
	GRAND_CAP: 1_500,
} as const;

export const XP_GAME_THRESHOLDS = {
	SMALL_COLLECTION: 5,
	MEDIUM_COLLECTION: 15,
	LARGE_COLLECTION: 30,
} as const;

export const XP_GAME_REWARDS = {
	FIRST_GAMES_BONUS: 75,
	SMALL_COLLECTION_BONUS: 20,
	MEDIUM_COLLECTION_BONUS: 10,
	LARGE_COLLECTION_BONUS: 5,
} as const;

export const XP_SOLO_BONUS = 25;

export const XP_STREAK = {
	LEGENDARY_WEEKS: 30,
	LEGENDARY_MULTIPLIER: 2.0,
	VETERAN_WEEKS: 7,
	VETERAN_MULTIPLIER: 1.5,
	APPRENTICE_WEEKS: 3,
	APPRENTICE_MULTIPLIER: 1.25,
	BASE_MULTIPLIER: 1.0,
} as const;

export const XP_WEEKEND_MULTIPLIER = 1.1;

export const XP_ONE_TIME_BONUSES: Readonly<Record<string, number>> = {
	game_added: 100,
	event_created: 150,
	participant_joined: 100,
} as const;

export const XP_FOUNDING = {
	BONUS: 150,
	COLLECTION_THRESHOLD: 10,
	WINDOW_MS: 24 * 60 * 60 * 1_000,
} as const;

export const DAY = {
	SUNDAY: 0,
	SATURDAY: 6,
} as const;
