import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseAuthGuard } from '../src/modules/auth/infrastructure/guards/firebase-auth.guard.js';
import { BggCsvService } from '../src/modules/games/application/bgg-csv.service.js';
import { BggIntegrationService } from '../src/modules/games/application/bgg-integration.service.js';
import { GamesService } from '../src/modules/games/application/games.service.js';
import { GamesController } from '../src/modules/games/presentation/games.controller.js';

const GAME_ID = 'c3d4e5f6-a7b8-4012-8cde-f12345678901';

const mockGame = {
	id: GAME_ID,
	bggId: 13,
	name: 'Catan',
	status: 'owned',
	yearPublished: 1995,
	createdBy: 'user-uid-123',
};

describe('Games API (e2e)', () => {
	let app: INestApplication;

	const mockGamesService = {
		importFromBgg: vi.fn().mockResolvedValue(mockGame),
		findAll: vi.fn().mockResolvedValue([mockGame]),
		findOne: vi.fn().mockResolvedValue(mockGame),
		update: vi.fn().mockResolvedValue({ ...mockGame, status: 'want_to_play' }),
		remove: vi.fn().mockResolvedValue(mockGame),
		getStats: vi.fn().mockResolvedValue({
			totalGames: 1,
			gamesByCategory: [],
			complexityDistribution: [],
			collectionGrowth: [],
		}),
	};

	const mockBggService = {
		searchGames: vi.fn().mockResolvedValue([]),
		getGameDetails: vi.fn(),
	};
	const mockBggCsvService = {
		search: vi.fn().mockResolvedValue([]),
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [GamesController],
			providers: [
				{ provide: GamesService, useValue: mockGamesService },
				{ provide: BggIntegrationService, useValue: mockBggService },
				{ provide: BggCsvService, useValue: mockBggCsvService },
			],
		})
			.overrideGuard(FirebaseAuthGuard)
			.useValue({
				canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
					const req = ctx.switchToHttp().getRequest();
					req.user = { uid: 'user-uid-123', email: 'test@example.com' };
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix('api');
		app.enableVersioning({ type: VersioningType.URI });
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockGamesService.importFromBgg.mockResolvedValue(mockGame);
		mockGamesService.findAll.mockResolvedValue([mockGame]);
		mockGamesService.findOne.mockResolvedValue(mockGame);
		mockGamesService.update.mockResolvedValue({
			...mockGame,
			status: 'want_to_play',
		});
		mockGamesService.remove.mockResolvedValue(mockGame);
		mockGamesService.getStats.mockResolvedValue({
			totalGames: 1,
			gamesByCategory: [],
			complexityDistribution: [],
			collectionGrowth: [],
		});
	});

	describe('POST /api/v1/games/import/:bggId', () => {
		it('should import a game from BGG and return 201', async () => {
			const res = await request(app.getHttpServer())
				.post('/api/v1/games/import/13')
				.send({ status: 'owned' })
				.expect(201);

			expect(res.body.id).toBe(GAME_ID);
			expect(res.body.name).toBe('Catan');
			expect(mockGamesService.importFromBgg).toHaveBeenCalledWith(
				13,
				{ status: 'owned' },
				'user-uid-123',
			);
		});
	});

	describe('GET /api/v1/games', () => {
		it('should return all user games', async () => {
			const res = await request(app.getHttpServer()).get('/api/v1/games').expect(200);

			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body[0].id).toBe(GAME_ID);
			expect(mockGamesService.findAll).toHaveBeenCalledWith(
				'user-uid-123',
				{ page: 1, limit: 20 },
				undefined,
			);
		});
	});

	describe('GET /api/v1/games/:id', () => {
		it('should return a single game by id', async () => {
			const res = await request(app.getHttpServer()).get(`/api/v1/games/${GAME_ID}`).expect(200);

			expect(res.body.id).toBe(GAME_ID);
			expect(mockGamesService.findOne).toHaveBeenCalledWith(GAME_ID, 'user-uid-123');
		});
	});

	describe('PATCH /api/v1/games/:id', () => {
		it('should update game personal fields', async () => {
			const res = await request(app.getHttpServer())
				.patch(`/api/v1/games/${GAME_ID}`)
				.send({ status: 'want_to_play' })
				.expect(200);

			expect(res.body.status).toBe('want_to_play');
			expect(mockGamesService.update).toHaveBeenCalledWith(
				GAME_ID,
				{ status: 'want_to_play' },
				'user-uid-123',
			);
		});
	});

	describe('DELETE /api/v1/games/:id', () => {
		it('should soft-delete a game', async () => {
			const res = await request(app.getHttpServer()).delete(`/api/v1/games/${GAME_ID}`).expect(200);

			expect(res.body.id).toBe(GAME_ID);
			expect(mockGamesService.remove).toHaveBeenCalledWith(GAME_ID, 'user-uid-123');
		});
	});

	describe('GET /api/v1/games/stats', () => {
		it('should return collection statistics', async () => {
			const res = await request(app.getHttpServer()).get('/api/v1/games/stats').expect(200);

			expect(res.body.totalGames).toBe(1);
			expect(mockGamesService.getStats).toHaveBeenCalledWith('user-uid-123');
		});
	});
});
