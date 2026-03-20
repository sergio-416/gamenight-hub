import type { LocationCreatedEvent } from '@locations/domain/events/location-created.event.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventsService } from '../events.service.js';
import { LocationCreatedListener } from './location-created.listener.js';

describe('LocationCreatedListener', () => {
	let listener: LocationCreatedListener;
	let mockEventsService: { create: ReturnType<typeof vi.fn> };

	beforeEach(async () => {
		vi.clearAllMocks();
		mockEventsService = {
			create: vi.fn().mockResolvedValue({ id: 'event-uuid-1' }),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [LocationCreatedListener, { provide: EventsService, useValue: mockEventsService }],
		}).compile();

		listener = module.get<LocationCreatedListener>(LocationCreatedListener);
	});

	it('should create an event when location.created fires with an eventDate', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'Board Game Cafe',
			address: 'Carrer de la Princesa, 1',
			capacity: 12,
			eventDate: '2026-03-15T19:00:00Z',
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		expect(mockEventsService.create).toHaveBeenCalledTimes(1);
		expect(mockEventsService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				locationId: 'loc-uuid-1',
				startTime: '2026-03-15T19:00:00.000Z',
				color: 'emerald',
			}),
			'test-user-uid',
		);
	});

	it('should not create an event when eventDate is undefined', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'Board Game Cafe',
			address: undefined,
			capacity: undefined,
			eventDate: undefined,
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		expect(mockEventsService.create).not.toHaveBeenCalled();
	});

	it('should include location name in the event title', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'The Dice Tower Lounge',
			address: undefined,
			capacity: 10,
			eventDate: '2026-04-01T18:00:00Z',
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		const createArg = mockEventsService.create.mock.calls[0][0];
		expect(createArg.title).toBe('Game Night at The Dice Tower Lounge');
	});

	it('should default maxPlayers to 8 when capacity is not provided', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'Cozy Apartment',
			address: '123 Main St',
			capacity: undefined,
			eventDate: '2026-05-01T20:00:00Z',
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		const createArg = mockEventsService.create.mock.calls[0][0];
		expect(createArg.maxPlayers).toBe(8);
	});

	it('should preserve capacity 0 and not replace it with default (nullish coalescing fix)', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'Virtual Room',
			address: undefined,
			capacity: 0,
			eventDate: '2026-06-01T17:00:00Z',
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		const createArg = mockEventsService.create.mock.calls[0][0];
		expect(createArg.maxPlayers).toBe(0);
	});

	it('should set endTime to 3 hours after startTime', async () => {
		const event: LocationCreatedEvent = {
			locationId: 'loc-uuid-1',
			name: 'Cafe',
			address: undefined,
			capacity: 6,
			eventDate: '2026-03-15T19:00:00Z',
			createdBy: 'test-user-uid',
		};

		await listener.handleLocationCreated(event);

		const createArg = mockEventsService.create.mock.calls[0][0];
		expect(createArg.endTime).toBe('2026-03-15T22:00:00.000Z');
	});
});
