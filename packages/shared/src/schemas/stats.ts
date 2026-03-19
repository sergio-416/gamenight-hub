export interface OrganiserStatsDto {
	eventsHosted: number;
	totalAttendees: number;
	popularGames: { name: string; eventCount: number }[];
}

export interface AdminStatsDto {
	totalUsers: number;
	totalEvents: number;
	totalGames: number;
}
