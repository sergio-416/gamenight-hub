export interface EventCover {
	slug: string;
	displayName: string;
	gameMatch: string;
}

export const EVENT_COVERS = [
	{ slug: '7Wonders_1', displayName: '7 Wonders', gameMatch: '7 wonders' },
	{ slug: '7Wonders_2', displayName: '7 Wonders', gameMatch: '7 wonders' },
	{
		slug: 'Carcassonne_1',
		displayName: 'Carcassonne',
		gameMatch: 'carcassonne',
	},
	{
		slug: 'Carcassonne_2',
		displayName: 'Carcassonne',
		gameMatch: 'carcassonne',
	},
	{ slug: 'Catan_1', displayName: 'Catan', gameMatch: 'catan' },
	{ slug: 'Catan_2', displayName: 'Catan', gameMatch: 'catan' },
	{ slug: 'DnD_1', displayName: 'Dungeons & Dragons', gameMatch: 'dnd' },
	{ slug: 'DnD_2', displayName: 'Dungeons & Dragons', gameMatch: 'dnd' },
	{
		slug: 'Ticket_to_Ride_1',
		displayName: 'Ticket to Ride',
		gameMatch: 'ticket to ride',
	},
	{
		slug: 'Ticket_to_Ride_2',
		displayName: 'Ticket to Ride',
		gameMatch: 'ticket to ride',
	},
	{ slug: 'miniatures_1', displayName: 'Miniatures', gameMatch: '' },
	{ slug: 'miniatures_2', displayName: 'Miniatures', gameMatch: '' },
	{ slug: 'party_1', displayName: 'Party', gameMatch: '' },
	{ slug: 'party_2', displayName: 'Party', gameMatch: '' },
	{ slug: 'strategy_1', displayName: 'Strategy', gameMatch: '' },
	{ slug: 'strategy_2', displayName: 'Strategy', gameMatch: '' },
] as const;

export type EventCoverSlug = (typeof EVENT_COVERS)[number]['slug'];

export const getEventCoverPath = (slug: EventCoverSlug): string =>
	`/assets/event-covers/${slug}.png`;
