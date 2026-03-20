import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { events, games, locations } from './schema/index.js';

const SEED_UID = 'seed-bootstrap-00000000';

const seedGames = [
	{
		name: 'Catan',
		bggId: 13,
		yearPublished: 1995,
		minPlayers: 3,
		maxPlayers: 4,
		playingTime: 120,
		minAge: 10,
		description:
			'In CATAN, players try to be the dominant force on the island of Catan by building settlements, cities, and roads.',
		categories: ['Negotiation', 'Economic'],
		mechanics: ['Dice Rolling', 'Trading'],
		publisher: 'KOSMOS',
		owned: true,
		complexity: 2,
		createdBy: SEED_UID,
	},
	{
		name: 'Ticket to Ride',
		bggId: 9209,
		yearPublished: 2004,
		minPlayers: 2,
		maxPlayers: 5,
		playingTime: 75,
		minAge: 8,
		categories: ['Family'],
		mechanics: ['Card Drafting', 'Route Building'],
		publisher: 'Days of Wonder',
		owned: true,
		complexity: 2,
		createdBy: SEED_UID,
	},
	{
		name: 'Pandemic',
		bggId: 30549,
		yearPublished: 2008,
		minPlayers: 2,
		maxPlayers: 4,
		playingTime: 45,
		minAge: 8,
		categories: ['Cooperative', 'Medical'],
		mechanics: ['Cooperative Play', 'Hand Management'],
		publisher: 'Z-Man Games',
		owned: true,
		complexity: 2,
		createdBy: SEED_UID,
	},
];

const seedLocations = [
	{
		name: 'Board Game Cafe Barcelona',
		latitude: 41.3851,
		longitude: 2.1734,
		address: 'Carrer de la Princesa, 1, Barcelona',
		venueType: 'cafe' as const,
		capacity: 20,
		amenities: ['WiFi', 'Food', 'Drinks'],
		hostName: 'Carlos',
		createdBy: SEED_UID,
	},
	{
		name: 'The Game Vault',
		latitude: 41.3927,
		longitude: 2.1581,
		address: "Avinguda del Portal de l'Àngel, 24, Barcelona",
		venueType: 'store' as const,
		capacity: 15,
		amenities: ['Game Library', 'Demos'],
		createdBy: SEED_UID,
	},
];

async function seed() {
	const url = process.env.POSTGRES_URL;
	if (!url) throw new Error('POSTGRES_URL environment variable is required');

	const client = postgres(url);
	const db = drizzle({ client });

	console.log('🌱 Seeding database...');

	const [insertedGame] = await db
		.insert(games)
		.values(seedGames.map((g) => ({ ...g, updatedAt: new Date() })))
		.onConflictDoNothing()
		.returning();

	const [insertedLocation] = await db
		.insert(locations)
		.values(seedLocations.map((l) => ({ ...l, updatedAt: new Date() })))
		.onConflictDoNothing()
		.returning();

	if (insertedGame && insertedLocation) {
		await db
			.insert(events)
			.values([
				{
					title: 'Catan Strategy Night',
					gameId: insertedGame.id,
					locationId: insertedLocation.id,
					startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
					maxPlayers: 4,
					description: 'Weekly Catan session — beginners welcome!',
					color: '#10B981',
					createdBy: SEED_UID,
					updatedAt: new Date(),
				},
			])
			.onConflictDoNothing();
	}

	console.log('✅ Seed complete');
	await client.end();
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
