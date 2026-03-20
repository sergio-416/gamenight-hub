import { environment } from '@env';

export const API_CONFIG = {
	baseUrl: environment.apiUrl,
	endpoints: {
		search: '/games/search',
		games: '/games',
		importGame: '/games/import',
		locations: '/locations',
		locationsBounds: '/locations/bounds',
		events: '/events',
		health: '/health',
		profileMe: '/profile/me',
		profile: '/profile',
		bggGame: '/games/bgg/game',
		ownedBggIds: '/games/owned-bgg-ids',
		xpProfile: '/xp/me',
		xpHistory: '/xp/me/history',
		magicLink: '/auth/magic-link',
	},
} as const;

export type ApiConfig = typeof API_CONFIG;
