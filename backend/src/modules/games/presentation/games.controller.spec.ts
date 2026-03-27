import { PAGINATION, UI } from '@gamenight-hub/shared';
import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { GamesService } from '../application/games.service.js';
import { GamesController } from './games.controller.js';

const MOCK_UID = 'user-uid-123';

describe('GamesController', () => {
	let controller: GamesController;

	const mockGamesService = {
		importFromBgg: vi.fn(),
		findAll: vi.fn(),
		findOne: vi.fn(),
		update: vi.fn(),
		remove: vi.fn(),
		getStats: vi.fn(),
		searchLocal: vi.fn(),
		searchBgg: vi.fn(),
		getBggGameDetails: vi.fn(),
		findOneEnriched: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [GamesController],
			providers: [{ provide: GamesService, useValue: mockGamesService }],
		})
			.overrideGuard(FirebaseAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<GamesController>(GamesController);
	});

	describe('POST /games/import/:bggId', () => {
		it('should import game from BGG and return created game', async () => {
			const createdGame = {
				id: 'uuid-123',
				bggId: 13,
				name: 'Catan',
				status: 'owned' as const,
				notes: 'My favorite game!',
				complexity: 3,
				createdBy: MOCK_UID,
			};

			mockGamesService.importFromBgg.mockResolvedValue(createdGame);

			const result = await controller.importGame(
				13,
				{ status: 'owned' as const, notes: 'My favorite game!', complexity: 3 },
				MOCK_UID,
			);

			expect(result.bggId).toBe(13);
			expect(result.name).toBe('Catan');
			expect(mockGamesService.importFromBgg).toHaveBeenCalledWith(13, expect.any(Object), MOCK_UID);
		});
	});

	describe('GET /games', () => {
		it('should return array of all games in user collection', async () => {
			const paginatedGames = {
				data: [
					{ id: '1', name: 'Catan', bggId: 13 },
					{ id: '2', name: 'Ticket to Ride', bggId: 42 },
				],
				total: 2,
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
				totalPages: 1,
			};
			mockGamesService.findAll.mockResolvedValue(paginatedGames);

			const result = await controller.findAll(MOCK_UID, { page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT });

			expect(Array.isArray(result.data)).toBe(true);
			expect(result.total).toBe(2);
			expect(mockGamesService.findAll).toHaveBeenCalledWith(
				MOCK_UID,
				{
					page: PAGINATION.DEFAULT_PAGE,
					limit: PAGINATION.DEFAULT_LIMIT,
				},
				undefined,
			);
		});
	});

	describe('GET /games/:id', () => {
		it('should return single game by id', async () => {
			const game = { id: 'uuid-123', name: 'Catan', status: 'owned' as const };
			mockGamesService.findOne.mockResolvedValue(game);

			const result = await controller.findOne('uuid-123', MOCK_UID);

			expect(result).toMatchObject({ id: 'uuid-123', name: 'Catan' });
			expect(mockGamesService.findOne).toHaveBeenCalledWith('uuid-123', MOCK_UID);
		});
	});

	describe('GET /games/:id/enriched', () => {
		it('should return enriched game with bgg stats and recommendations', async () => {
			const enriched = {
				id: 'uuid-123',
				name: 'Catan',
				bggRating: 7.45,
				bggRank: 42,
				recommendations: [],
			};
			mockGamesService.findOneEnriched.mockResolvedValue(enriched);

			const result = await controller.findOneEnriched('uuid-123', MOCK_UID);

			expect(result.bggRating).toBe(7.45);
			expect(result.bggRank).toBe(42);
			expect(mockGamesService.findOneEnriched).toHaveBeenCalledWith('uuid-123', MOCK_UID);
		});
	});

	describe('PATCH /games/:id', () => {
		it('should update personal fields and return updated game', async () => {
			const updatedGame = {
				id: 'uuid-123',
				name: 'Catan',
				status: 'owned' as const,
				notes: 'Updated!',
			};
			mockGamesService.update.mockResolvedValue(updatedGame);

			const result = await controller.update(
				'uuid-123',
				{ status: 'owned' as const, notes: 'Updated!' },
				MOCK_UID,
			);

			expect(result.notes).toBe('Updated!');
			expect(mockGamesService.update).toHaveBeenCalledWith(
				'uuid-123',
				expect.any(Object),
				MOCK_UID,
			);
		});
	});

	describe('DELETE /games/:id', () => {
		it('should soft-delete game and return deleted game data', async () => {
			const deletedGame = { id: 'uuid-123', name: 'Catan' };
			mockGamesService.remove.mockResolvedValue(deletedGame);

			const result = await controller.remove('uuid-123', MOCK_UID);

			expect(result.id).toBe('uuid-123');
			expect(mockGamesService.remove).toHaveBeenCalledWith('uuid-123', MOCK_UID);
		});
	});

	describe('GET /games/stats', () => {
		it('should return statistics for user games collection', async () => {
			const mockStats = {
				gamesByCategory: [{ name: 'Strategy', value: 5 }],
				complexityDistribution: [{ name: '3 - Medium', value: 4 }],
				collectionGrowth: [{ x: '2024-01', y: 1 }],
				totalGames: 10,
			};
			mockGamesService.getStats.mockResolvedValue(mockStats);

			const result = await controller.getStats(MOCK_UID);

			expect(result.totalGames).toBe(10);
			expect(result.gamesByCategory).toHaveLength(1);
			expect(mockGamesService.getStats).toHaveBeenCalledWith(MOCK_UID);
		});

		it('should return empty stats when no games in collection', async () => {
			mockGamesService.getStats.mockResolvedValue({
				gamesByCategory: [],
				complexityDistribution: [],
				collectionGrowth: [],
				totalGames: 0,
			});

			const result = await controller.getStats(MOCK_UID);

			expect(result.totalGames).toBe(0);
			expect(result.gamesByCategory).toHaveLength(0);
		});
	});

	describe('GET /games/bgg/search', () => {
		it('should return search results from BoardGameGeek', async () => {
			const searchResults = [
				{ bggId: 13, name: 'Catan', yearPublished: 1995 },
				{ bggId: 115746, name: 'Catan: Seafarers', yearPublished: 1997 },
			];
			mockGamesService.searchBgg.mockResolvedValue(searchResults);

			const result = await controller.searchBgg('catan');

			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('name');
		});
	});

	describe('GET /games/bgg/game/:bggId', () => {
		it('should return full game details from BoardGameGeek', async () => {
			const gameDetails = { bggId: 13, name: 'Catan', yearPublished: 1995 };
			mockGamesService.getBggGameDetails.mockResolvedValue(gameDetails);

			const result = await controller.getBggGameDetails(13);

			expect(result.bggId).toBe(13);
			expect(result.name).toBe('Catan');
		});
	});

	describe('GET /games/search', () => {
		it('should return matching games from local CSV', async () => {
			const csvResults = [{ id: '13', name: 'CATAN', rank: '5' }];
			mockGamesService.searchLocal.mockResolvedValue(csvResults);

			const result = await controller.searchLocal('catan');

			expect(result).toHaveLength(1);
			expect(mockGamesService.searchLocal).toHaveBeenCalledWith('catan');
		});

		it('should return empty array when no matches found', async () => {
			mockGamesService.searchLocal.mockResolvedValue([]);

			const result = await controller.searchLocal('nonexistentgame12345');

			expect(result).toEqual([]);
		});
	});
});
