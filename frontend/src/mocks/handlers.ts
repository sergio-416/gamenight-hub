import { HttpResponse, http } from "msw";
import type { Event } from "../app/features/calendar/models/event.model";
import type { Game } from "../app/features/collection/models/game.model";
import type { Location } from "../app/features/game-nights/models/location.model";

const BASE_URL = "http://localhost:3000/api/v1";

export const mockGames: Game[] = [
	{
		id: "game-uuid-1",
		name: "Catan",
		bggId: 13,
		status: "owned",
		yearPublished: 1995,
		minPlayers: 3,
		maxPlayers: 4,
	},
	{
		id: "game-uuid-2",
		name: "Ticket to Ride",
		bggId: 42,
		status: "want_to_play",
		yearPublished: 2004,
	},
];

export const mockLocations: Location[] = [
	{
		id: "loc-uuid-1",
		name: "Board Game Cafe",
		latitude: 41.38,
		longitude: 2.17,
		venueType: "cafe",
	},
	{
		id: "loc-uuid-2",
		name: "Game Store",
		latitude: 41.4,
		longitude: 2.18,
		venueType: "store",
	},
];

export const mockEvents: Event[] = [
	{
		id: "event-uuid-1",
		title: "Game Night Friday",
		locationId: "loc-uuid-1",
		startTime: new Date("2026-03-01T19:00:00"),
		endTime: new Date("2026-03-01T23:00:00"),
		maxPlayers: 6,
	},
];

function paginateData<T>(data: T[]) {
	return { data, total: data.length, page: 1, limit: 20, totalPages: 1 };
}

export const handlers = [
	http.get(`${BASE_URL}/games`, () =>
		HttpResponse.json(paginateData(mockGames)),
	),
	http.get(`${BASE_URL}/games/stats`, () =>
		HttpResponse.json({
			totalGames: 2,
			gamesByCategory: [{ name: "Strategy", value: 2 }],
			complexityDistribution: [{ name: "Medium", value: 2 }],
			collectionGrowth: [{ x: "2026-01", y: 2 }],
		}),
	),
	http.get(`${BASE_URL}/games/:id`, ({ params }) =>
		HttpResponse.json(
			mockGames.find((g) => g.id === params["id"]) ?? mockGames[0],
		),
	),
	http.post(`${BASE_URL}/games/import/:bggId`, () =>
		HttpResponse.json(mockGames[0]),
	),
	http.delete(`${BASE_URL}/games/:id`, ({ params }) =>
		HttpResponse.json(
			mockGames.find((g) => g.id === params["id"]) ?? mockGames[0],
		),
	),
	http.get(`${BASE_URL}/locations`, () =>
		HttpResponse.json(paginateData(mockLocations)),
	),
	http.get(`${BASE_URL}/locations/bounds`, () =>
		HttpResponse.json(mockLocations),
	),
	http.post(`${BASE_URL}/locations`, async ({ request }) => {
		const body = (await request.json()) as Partial<Location>;
		return HttpResponse.json({ id: "new-loc-uuid", ...body });
	}),
	http.delete(`${BASE_URL}/locations/:id`, ({ params }) =>
		HttpResponse.json(
			mockLocations.find((l) => l.id === params["id"]) ?? mockLocations[0],
		),
	),
	http.get(`${BASE_URL}/events`, () =>
		HttpResponse.json(paginateData(mockEvents)),
	),
	http.post(`${BASE_URL}/events`, async ({ request }) => {
		const body = (await request.json()) as Partial<Event>;
		return HttpResponse.json({ id: "new-event-uuid", ...body });
	}),
	http.patch(`${BASE_URL}/events/:id`, async ({ params, request }) => {
		const body = (await request.json()) as Partial<Event>;
		const event =
			mockEvents.find((e) => e.id === params["id"]) ?? mockEvents[0];
		return HttpResponse.json({ ...event, ...body });
	}),
	http.delete(`${BASE_URL}/events/:id`, ({ params }) =>
		HttpResponse.json(
			mockEvents.find((e) => e.id === params["id"]) ?? mockEvents[0],
		),
	),
];
