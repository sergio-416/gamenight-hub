export interface XpProfile {
	userId: string;
	xpTotal: number;
	level: number;
	streakWeeks: number;
	lastActivityAt: string | null;
	levelTitle: string;
	nextLevelXp: number;
	xpToNextLevel: number;
	progressPercent: number;
}

export interface XpTransaction {
	id: string;
	action: XpAction;
	baseXp: number;
	multiplier: number;
	finalXp: number;
	metadata: Record<string, unknown>;
	createdAt: string;
}

const XP_ACTION = {
	GAME_ADDED: "game_added",
	EVENT_CREATED: "event_created",
	PARTICIPANT_JOINED: "participant_joined",
} as const;

export type XpAction = (typeof XP_ACTION)[keyof typeof XP_ACTION];

export interface XpAwardFeedback {
	xpAwarded: number;
	action: XpAction;
	levelUp: boolean;
	newLevel?: number;
}

export interface XpHistoryResponse {
	data: XpTransaction[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const LEVEL_TITLES: Record<number, string> = {
	1: "Wandering Pawn",
	2: "Curious Collector",
	3: "Apprentice Archivist",
	4: "Tavern Regular",
	5: "Guild Member",
	6: "Seasoned Strategist",
	7: "Lorekeeper",
	8: "Knight of the Table",
	9: "High Chamberlain",
	10: "Archmage of the Table",
};

export const LEVEL_TIERS: Record<number, string> = {
	1: "Novice",
	2: "Novice",
	3: "Novice",
	4: "Enthusiast",
	5: "Enthusiast",
	6: "Enthusiast",
	7: "Veteran",
	8: "Veteran",
	9: "Veteran",
	10: "Legendary",
};

export const XP_ACTION_LABELS: Record<XpAction, string> = {
	game_added: "Added a game",
	event_created: "Created an event",
	participant_joined: "Joined an event",
};
