import { DB_TOKEN } from '@database/database.module.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { buildMockDb, chainResolving } from '@test/db-mock.js';
import { GamesAnalyticsService } from './games-analytics.service.js';

const OWNER_UID = 'user-uid-123';

const makeGame = (overrides = {}) => ({
	id: '507f1f77-bcf8-6cd7-9943-9011aaaabbbb',
	name: 'Catan',
	bggId: 13,
	yearPublished: 1995,
	minPlayers: 3,
	maxPlayers: 4,
	playingTime: 90,
	minAge: 10,
	description: 'Trade and build settlements',
	categories: ['Strategy', 'Family'],
	mechanics: ['Dice Rolling', 'Trading'],
	publisher: 'Kosmos',
	owned: true,
	notes: null,
	complexity: 3,
	createdBy: OWNER_UID,
	deletedAt: null,
	createdAt: new Date('2026-01-15'),
	updatedAt: new Date('2026-01-15'),
	...overrides,
});

describe('GamesAnalyticsService', () => {
	let service: GamesAnalyticsService;
	let mockDb: ReturnType<typeof buildMockDb>;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockDb = buildMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [GamesAnalyticsService, { provide: DB_TOKEN, useValue: mockDb }],
		}).compile();

		service = module.get<GamesAnalyticsService>(GamesAnalyticsService);
	});

	describe('getStats', () => {
		it('should return correct aggregation shape with games', async () => {
			const games = [
				makeGame(),
				makeGame({
					id: 'uuid-2',
					name: 'Ticket to Ride',
					categories: ['Family', 'Travel'],
					complexity: 2,
					createdAt: new Date('2026-02-10'),
				}),
				makeGame({
					id: 'uuid-3',
					name: 'Twilight Imperium',
					categories: ['Strategy'],
					complexity: 5,
					createdAt: new Date('2026-01-20'),
				}),
			];

			mockDb.select.mockReturnValue(chainResolving(games));

			const result = await service.getStats(OWNER_UID);

			expect(result.totalGames).toBe(3);

			expect(result.gamesByCategory).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'Strategy', value: 2 }),
					expect.objectContaining({ name: 'Family', value: 2 }),
					expect.objectContaining({ name: 'Travel', value: 1 }),
				]),
			);

			expect(result.complexityDistribution).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: '3 - Medium', value: 1 }),
					expect.objectContaining({ name: '2 - Light-Medium', value: 1 }),
					expect.objectContaining({ name: '5 - Heavy', value: 1 }),
				]),
			);

			expect(result.collectionGrowth).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ x: '2026-01', y: 2 }),
					expect.objectContaining({ x: '2026-02', y: 1 }),
				]),
			);

			expect(result.collectionGrowth[0].x.localeCompare(result.collectionGrowth[1].x)).toBe(-1);
		});

		it('should return sensible defaults for empty collection', async () => {
			mockDb.select.mockReturnValue(chainResolving([]));

			const result = await service.getStats(OWNER_UID);

			expect(result.totalGames).toBe(0);
			expect(result.gamesByCategory).toEqual([]);
			expect(result.complexityDistribution).toEqual([]);
			expect(result.collectionGrowth).toEqual([]);
		});

		it('should handle games with null categories and null complexity', async () => {
			const games = [makeGame({ categories: null, complexity: null })];

			mockDb.select.mockReturnValue(chainResolving(games));

			const result = await service.getStats(OWNER_UID);

			expect(result.totalGames).toBe(1);
			expect(result.gamesByCategory).toEqual([]);
			expect(result.complexityDistribution).toEqual([]);
		});
	});
});
