import { DB_TOKEN } from '@database/database.module.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { buildMockDb, chainResolving } from '@test/db-mock.js';
import { LocationsService } from '../../locations/application/locations.service.js';
import { EventCreatedEvent } from '../domain/events/event-created.event.js';
import type { CreateEventDto } from '../presentation/dto/create-event.dto.js';
import { EventsService } from './events.service.js';

const OWNER_UID = 'user-uid-123';
const OTHER_UID = 'user-uid-456';

const makeLocation = (overrides = {}) => ({
	id: '507f1f77-bcf8-6cd7-9943-9022aaaabbbb',
	name: 'The Board Room',
	latitude: 41.3851,
	longitude: 2.1734,
	address: '123 Game Street',
	venueType: 'cafe',
	createdBy: OWNER_UID,
	deletedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

const makeEvent = (overrides = {}) => ({
	id: '507f1f77-bcf8-6cd7-9943-9033aaaabbbb',
	title: 'Catan Night at the Cafe',
	gameId: '507f1f77-bcf8-6cd7-9943-9011aaaabbbb',
	locationId: '507f1f77-bcf8-6cd7-9943-9022aaaabbbb',
	startTime: new Date('2026-02-15T19:00:00Z'),
	endTime: null,
	maxPlayers: 4,
	description: null,
	color: null,
	createdBy: OWNER_UID,
	deletedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

describe('EventsService', () => {
	let service: EventsService;
	let mockDb: ReturnType<typeof buildMockDb>;
	let mockEventEmitter: {
		emit: ReturnType<typeof vi.fn>;
		emitAsync: ReturnType<typeof vi.fn>;
	};
	let mockLocationsService: { create: ReturnType<typeof vi.fn> };

	beforeEach(async () => {
		vi.clearAllMocks();
		const event = makeEvent();
		mockDb = buildMockDb({
			select: [event],
			insert: [event],
			update: [event],
		});
		mockEventEmitter = {
			emit: vi.fn(),
			emitAsync: vi.fn().mockResolvedValue([]),
		};
		mockLocationsService = { create: vi.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventsService,
				{ provide: DB_TOKEN, useValue: mockDb },
				{ provide: EventEmitter2, useValue: mockEventEmitter },
				{ provide: LocationsService, useValue: mockLocationsService },
			],
		}).compile();

		service = module.get<EventsService>(EventsService);
	});

	describe('create event', () => {
		it('should persist new game night event to database', async () => {
			const createDto: CreateEventDto = {
				title: 'Catan Night at the Cafe',
				gameId: '507f1f77-bcf8-6cd7-9943-9011aaaabbbb',
				locationId: '507f1f77-bcf8-6cd7-9943-9022aaaabbbb',
				startTime: '2026-02-15T19:00:00Z',
				maxPlayers: 4,
			};

			const result = await service.create(createDto, OWNER_UID);

			expect(result.title).toBe('Catan Night at the Cafe');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should create event with existing locationId', async () => {
			const createDto: CreateEventDto = {
				title: 'Catan Night',
				locationId: '507f1f77-bcf8-6cd7-9943-9022aaaabbbb',
				startTime: '2026-02-15T19:00:00Z',
				maxPlayers: 4,
			};

			const result = await service.create(createDto, OWNER_UID);

			expect(result.locationId).toBe('507f1f77-bcf8-6cd7-9943-9022aaaabbbb');
			expect(mockLocationsService.create).not.toHaveBeenCalled();
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should create location inline then create event with new locationId', async () => {
			const newLocationId = '507f1f77-bcf8-6cd7-9943-newlocation00';
			const createdLocation = makeLocation({ id: newLocationId });
			mockLocationsService.create.mockResolvedValue(createdLocation);

			mockDb.insert.mockReturnValue(chainResolving([makeEvent({ locationId: newLocationId })]));

			const createDto: CreateEventDto = {
				title: 'Catan Night',
				location: {
					name: 'The Board Room',
					venueType: 'cafe',
					address: '123 Game Street',
					latitude: 41.3851,
					longitude: 2.1734,
				},
				startTime: '2026-02-15T19:00:00Z',
				maxPlayers: 4,
			};

			const result = await service.create(createDto, OWNER_UID);

			expect(mockLocationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'The Board Room', venueType: 'cafe' }),
				OWNER_UID,
			);
			expect(result.locationId).toBe(newLocationId);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should not create event if inline location creation fails', async () => {
			mockLocationsService.create.mockRejectedValue(new Error('DB error'));

			const createDto: CreateEventDto = {
				title: 'Catan Night',
				location: {
					name: 'The Board Room',
					latitude: 41.3851,
					longitude: 2.1734,
				},
				startTime: '2026-02-15T19:00:00Z',
				maxPlayers: 4,
			};

			await expect(service.create(createDto, OWNER_UID)).rejects.toThrow('DB error');
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should emit event.created after successful creation', async () => {
			const createDto: CreateEventDto = {
				title: 'Catan Night at the Cafe',
				gameId: '507f1f77-bcf8-6cd7-9943-9011aaaabbbb',
				locationId: '507f1f77-bcf8-6cd7-9943-9022aaaabbbb',
				startTime: '2026-02-15T19:00:00Z',
				maxPlayers: 4,
			};

			await service.create(createDto, OWNER_UID);

			expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
				'event.created',
				expect.any(EventCreatedEvent),
			);
			expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
				'event.created',
				expect.objectContaining({
					eventId: '507f1f77-bcf8-6cd7-9943-9033aaaabbbb',
					title: 'Catan Night at the Cafe',
					createdBy: OWNER_UID,
				}),
			);
		});
	});

	describe('find all events', () => {
		it('should return all persisted events from database', async () => {
			const mockEvents = [
				{ ...makeEvent(), participantCount: 0, gameThumbnailUrl: null, gameImageUrl: null },
				{
					...makeEvent({ id: 'uuid-2', title: 'Ticket Night' }),
					participantCount: 0,
					gameThumbnailUrl: null,
					gameImageUrl: null,
				},
			];
			mockDb.select
				.mockReturnValueOnce(chainResolving(mockEvents))
				.mockReturnValueOnce(chainResolving([{ value: 2 }]));

			const result = await service.findAll();

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.data[0]).not.toHaveProperty('deletedAt');
			expect(result.data[0]).not.toHaveProperty('createdAt');
			expect(result.data[0]).not.toHaveProperty('updatedAt');
			expect(result.data[0]).not.toHaveProperty('createdBy');
			expect(result.data[0]).toHaveProperty('participantCount');
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should return empty array when database has no events', async () => {
			mockDb.select
				.mockReturnValueOnce(chainResolving([]))
				.mockReturnValueOnce(chainResolving([{ value: 0 }]));

			const result = await service.findAll();

			expect(result.data).toEqual([]);
			expect(result.total).toBe(0);
		});
	});

	describe('find one event', () => {
		it('should return event by id from database', async () => {
			const event = {
				...makeEvent(),
				participantCount: 0,
				gameThumbnailUrl: null,
				gameImageUrl: null,
				gameName: null,
				gameComplexity: null,
				gamePlayingTime: null,
				gameMinPlayers: null,
				gameMaxPlayers: null,
				hostUsername: null,
				hostAvatar: null,
			};
			mockDb.select.mockReturnValue(chainResolving([event]));

			const result = await service.findOne(event.id);

			expect(result.id).toBe(event.id);
			expect(result).toHaveProperty('createdBy');
			expect(result).toHaveProperty('hostUsername');
			expect(result).toHaveProperty('gameName');
		});

		it('should throw NotFoundException when event id not found', async () => {
			mockDb.select.mockReturnValue(chainResolving([]));

			await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('update event', () => {
		it('should update event fields in database', async () => {
			const event = makeEvent();
			const updated = makeEvent({
				title: 'Updated Catan Night',
				maxPlayers: 6,
			});

			mockDb.select.mockReturnValue(chainResolving([event]));
			mockDb.update.mockReturnValue(chainResolving([updated]));

			const result = await service.update(
				event.id,
				{ title: 'Updated Catan Night', maxPlayers: 6 },
				OWNER_UID,
			);

			expect(result.title).toBe('Updated Catan Night');
			expect(result.maxPlayers).toBe(6);
		});

		it('should throw ForbiddenException when updating event owned by another user', async () => {
			const event = makeEvent({ createdBy: OTHER_UID });
			mockDb.select.mockReturnValue(chainResolving([event]));

			await expect(service.update(event.id, { title: 'Hijacked' }, OWNER_UID)).rejects.toThrow(
				ForbiddenException,
			);
		});

		it('should throw ForbiddenException when updating an event owned by a different uid', async () => {
			const foreignEvent = makeEvent({ createdBy: 'seed-bootstrap-00000000' });
			mockDb.select.mockReturnValue(chainResolving([foreignEvent]));

			await expect(
				service.update(foreignEvent.id, { title: 'Updated by user' }, OWNER_UID),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('remove event', () => {
		it('should soft-delete event from database', async () => {
			const event = makeEvent();
			mockDb.select.mockReturnValue(chainResolving([event]));

			const result = await service.remove(event.id, OWNER_UID);

			expect(result.id).toBe(event.id);
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw ForbiddenException when deleting event owned by another user', async () => {
			const event = makeEvent({ createdBy: OTHER_UID });
			mockDb.select.mockReturnValue(chainResolving([event]));

			await expect(service.remove(event.id, OWNER_UID)).rejects.toThrow(ForbiddenException);
		});

		it('should throw ForbiddenException when deleting an event owned by a different uid', async () => {
			const foreignEvent = makeEvent({ createdBy: 'seed-bootstrap-00000000' });
			mockDb.select.mockReturnValue(chainResolving([foreignEvent]));

			await expect(service.remove(foreignEvent.id, OWNER_UID)).rejects.toThrow(ForbiddenException);
		});
	});
});
