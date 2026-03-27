import type { SelectEvent } from '@database/schema/events.js';

export interface EventListResponse {
	id: string;
	title: string;
	locationId: string;
	startTime: Date;
	endTime: Date | null;
	maxPlayers: number | null;
	description: string | null;
	coverImage: string | null;
	category: string | null;
	participantCount: number;
	gameThumbnailUrl: string | null;
	gameImageUrl: string | null;
}

export interface EventDetailResponse extends EventListResponse {
	createdBy: string;
	isOwner: boolean;
	hostUsername: string | null;
	hostAvatar: string | null;
	gameName: string | null;
	gameComplexity: number | null;
	gamePlayingTime: number | null;
	gameMinPlayers: number | null;
	gameMaxPlayers: number | null;
}

export function toEventListResponse(
	event: SelectEvent & {
		participantCount: number;
		gameThumbnailUrl: string | null;
		gameImageUrl: string | null;
	},
): EventListResponse {
	return {
		id: event.id,
		title: event.title,
		locationId: event.locationId,
		startTime: event.startTime,
		endTime: event.endTime,
		maxPlayers: event.maxPlayers,
		description: event.description,
		coverImage: event.coverImage,
		category: event.category,
		participantCount: event.participantCount,
		gameThumbnailUrl: event.gameThumbnailUrl,
		gameImageUrl: event.gameImageUrl,
	};
}

export function toEventDetailResponse(
	event: SelectEvent & {
		participantCount: number;
		gameThumbnailUrl: string | null;
		gameImageUrl: string | null;
		gameName: string | null;
		gameComplexity: number | null;
		gamePlayingTime: number | null;
		gameMinPlayers: number | null;
		gameMaxPlayers: number | null;
		hostUsername: string | null;
		hostAvatar: string | null;
	},
	requestingUserId: string,
): EventDetailResponse {
	return {
		...toEventListResponse(event),
		createdBy: event.createdBy,
		isOwner: event.createdBy === requestingUserId,
		hostUsername: event.hostUsername,
		hostAvatar: event.hostAvatar,
		gameName: event.gameName,
		gameComplexity: event.gameComplexity,
		gamePlayingTime: event.gamePlayingTime,
		gameMinPlayers: event.gameMinPlayers,
		gameMaxPlayers: event.gameMaxPlayers,
	};
}
