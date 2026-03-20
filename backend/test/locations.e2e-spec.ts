import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseAuthGuard } from '../src/modules/auth/infrastructure/guards/firebase-auth.guard.js';
import { LocationsService } from '../src/modules/locations/application/locations.service.js';
import { LocationsController } from '../src/modules/locations/presentation/locations.controller.js';

const LOC_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockLocation = {
	id: LOC_ID,
	name: 'Board Game Cafe',
	latitude: 40.7128,
	longitude: -74.006,
	address: '123 Main St',
	venueType: 'cafe',
	capacity: 30,
	amenities: ['wifi', 'snacks'],
	description: 'A cozy cafe for board games',
	hostName: 'John',
	createdBy: 'user-uid-123',
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null,
};

const mockPaginatedResponse = {
	data: [mockLocation],
	total: 1,
	page: 1,
	limit: 20,
	totalPages: 1,
};

describe('Locations API (e2e)', () => {
	let app: INestApplication;

	const mockLocationsService = {
		create: vi.fn().mockResolvedValue(mockLocation),
		findAll: vi.fn().mockResolvedValue(mockPaginatedResponse),
		findOne: vi.fn().mockResolvedValue(mockLocation),
		update: vi.fn().mockResolvedValue({ ...mockLocation, name: 'Updated Cafe' }),
		remove: vi.fn().mockResolvedValue(mockLocation),
		findInBounds: vi.fn().mockResolvedValue([mockLocation]),
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [LocationsController],
			providers: [{ provide: LocationsService, useValue: mockLocationsService }],
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
		mockLocationsService.create.mockResolvedValue(mockLocation);
		mockLocationsService.findAll.mockResolvedValue(mockPaginatedResponse);
		mockLocationsService.findOne.mockResolvedValue(mockLocation);
		mockLocationsService.update.mockResolvedValue({
			...mockLocation,
			name: 'Updated Cafe',
		});
		mockLocationsService.remove.mockResolvedValue(mockLocation);
		mockLocationsService.findInBounds.mockResolvedValue([mockLocation]);
	});

	describe('POST /api/v1/locations', () => {
		it('should create a location when authenticated', async () => {
			const createDto = {
				name: 'Board Game Cafe',
				latitude: 40.7128,
				longitude: -74.006,
				address: '123 Main St',
				venueType: 'cafe',
				capacity: 30,
			};

			const res = await request(app.getHttpServer())
				.post('/api/v1/locations')
				.send(createDto)
				.expect(201);

			expect(res.body.id).toBe(LOC_ID);
			expect(res.body.name).toBe('Board Game Cafe');
			expect(mockLocationsService.create).toHaveBeenCalledWith(createDto, 'user-uid-123');
		});
	});

	describe('GET /api/v1/locations', () => {
		it('should return a paginated list of locations', async () => {
			const res = await request(app.getHttpServer()).get('/api/v1/locations').expect(200);

			expect(res.body.data).toBeDefined();
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data[0].id).toBe(LOC_ID);
			expect(res.body.total).toBe(1);
			expect(res.body.page).toBe(1);
			expect(mockLocationsService.findAll).toHaveBeenCalled();
		});
	});

	describe('GET /api/v1/locations/:id', () => {
		it('should return a single location by id', async () => {
			const res = await request(app.getHttpServer()).get(`/api/v1/locations/${LOC_ID}`).expect(200);

			expect(res.body.id).toBe(LOC_ID);
			expect(res.body.name).toBe('Board Game Cafe');
			expect(mockLocationsService.findOne).toHaveBeenCalledWith(LOC_ID);
		});
	});

	describe('PATCH /api/v1/locations/:id', () => {
		it('should update a location when authenticated as owner', async () => {
			const res = await request(app.getHttpServer())
				.patch(`/api/v1/locations/${LOC_ID}`)
				.send({ name: 'Updated Cafe' })
				.expect(200);

			expect(res.body.name).toBe('Updated Cafe');
			expect(mockLocationsService.update).toHaveBeenCalledWith(
				LOC_ID,
				{ name: 'Updated Cafe' },
				'user-uid-123',
			);
		});

		it('should return 403 when authenticated but not owner', async () => {
			const { ForbiddenException } = await import('@nestjs/common');
			mockLocationsService.update.mockRejectedValue(new ForbiddenException('Access denied'));

			await request(app.getHttpServer())
				.patch(`/api/v1/locations/${LOC_ID}`)
				.send({ name: 'Hijacked Cafe' })
				.expect(403);
		});
	});

	describe('DELETE /api/v1/locations/:id', () => {
		it('should soft-delete a location when authenticated as owner', async () => {
			const res = await request(app.getHttpServer())
				.delete(`/api/v1/locations/${LOC_ID}`)
				.expect(200);

			expect(res.body.id).toBe(LOC_ID);
			expect(mockLocationsService.remove).toHaveBeenCalledWith(LOC_ID, 'user-uid-123');
		});
	});
});
