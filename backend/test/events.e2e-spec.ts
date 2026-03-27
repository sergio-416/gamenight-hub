import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseAuthGuard } from '../src/modules/auth/infrastructure/guards/firebase-auth.guard.js';
import { EventsService } from '../src/modules/events/application/events.service.js';
import { EventsController } from '../src/modules/events/presentation/events.controller.js';

const EVENT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const LOC_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const GAME_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const mockEvent = {
	id: EVENT_ID,
	title: 'Friday Night Catan',
	gameId: GAME_ID,
	locationId: LOC_ID,
	startTime: new Date('2026-03-01T19:00:00.000Z'),
	endTime: new Date('2026-03-01T22:00:00.000Z'),
	maxPlayers: 6,
	description: 'Weekly Catan session',
	coverImage: null,
	category: null,
	participantCount: 0,
	gameThumbnailUrl: null,
	gameImageUrl: null,
};

const mockPaginatedResponse = {
	data: [mockEvent],
	total: 1,
	page: 1,
	limit: 20,
	totalPages: 1,
};

describe('Events API (e2e)', () => {
	let app: INestApplication;

	const mockEventsService = {
		create: vi.fn().mockResolvedValue(mockEvent),
		findAll: vi.fn().mockResolvedValue(mockPaginatedResponse),
		findOne: vi.fn(),
		update: vi.fn().mockResolvedValue({ ...mockEvent, title: 'Updated Game Night' }),
		remove: vi.fn().mockResolvedValue(mockEvent),
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [EventsController],
			providers: [{ provide: EventsService, useValue: mockEventsService }],
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

	const mockDetailEvent = {
		...mockEvent,
		createdBy: 'user-uid-123',
		isOwner: true,
		hostUsername: null,
		hostAvatar: null,
		gameName: null,
		gameComplexity: null,
		gamePlayingTime: null,
		gameMinPlayers: null,
		gameMaxPlayers: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockEventsService.create.mockResolvedValue(mockEvent);
		mockEventsService.findAll.mockResolvedValue(mockPaginatedResponse);
		mockEventsService.findOne.mockResolvedValue(mockDetailEvent);
		mockEventsService.update.mockResolvedValue({
			...mockEvent,
			title: 'Updated Game Night',
		});
		mockEventsService.remove.mockResolvedValue(mockEvent);
	});

	describe('POST /api/v1/events', () => {
		it('should create an event when authenticated', async () => {
			const createDto = {
				title: 'Friday Night Catan',
				locationId: LOC_ID,
				startTime: '2026-03-01T19:00:00.000Z',
				endTime: '2026-03-01T22:00:00.000Z',
				maxPlayers: 6,
				description: 'Weekly Catan session',
			};

			const res = await request(app.getHttpServer())
				.post('/api/v1/events')
				.send(createDto)
				.expect(201);

			expect(res.body.id).toBe(EVENT_ID);
			expect(res.body.title).toBe('Friday Night Catan');
			expect(mockEventsService.create).toHaveBeenCalledWith(createDto, 'user-uid-123');
		});
	});

	describe('GET /api/v1/events', () => {
		it('should return a list of events', async () => {
			const res = await request(app.getHttpServer()).get('/api/v1/events').expect(200);

			expect(res.body.data).toBeDefined();
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data[0].id).toBe(EVENT_ID);
			expect(res.body.data[0]).not.toHaveProperty('createdBy');
			expect(res.body.data[0]).not.toHaveProperty('deletedAt');
			expect(res.body.data[0]).not.toHaveProperty('updatedAt');
			expect(res.body.data[0]).not.toHaveProperty('createdAt');
			expect(res.body.total).toBe(1);
			expect(mockEventsService.findAll).toHaveBeenCalled();
		});
	});

	describe('PATCH /api/v1/events/:id', () => {
		it('should update an event when authenticated as owner', async () => {
			const res = await request(app.getHttpServer())
				.patch(`/api/v1/events/${EVENT_ID}`)
				.send({ title: 'Updated Game Night' })
				.expect(200);

			expect(res.body.title).toBe('Updated Game Night');
			expect(mockEventsService.update).toHaveBeenCalledWith(
				EVENT_ID,
				{ title: 'Updated Game Night' },
				'user-uid-123',
			);
		});

		it('should return 403 when authenticated but not owner and not system', async () => {
			const { ForbiddenException } = await import('@nestjs/common');
			mockEventsService.update.mockRejectedValue(new ForbiddenException('Access denied'));

			await request(app.getHttpServer())
				.patch(`/api/v1/events/${EVENT_ID}`)
				.send({ title: 'Hijacked Event' })
				.expect(403);
		});
	});

	describe('DELETE /api/v1/events/:id', () => {
		it('should delete an event when authenticated as owner', async () => {
			const res = await request(app.getHttpServer())
				.delete(`/api/v1/events/${EVENT_ID}`)
				.expect(200);

			expect(res.body.id).toBe(EVENT_ID);
			expect(mockEventsService.remove).toHaveBeenCalledWith(EVENT_ID, 'user-uid-123');
		});
	});
});
