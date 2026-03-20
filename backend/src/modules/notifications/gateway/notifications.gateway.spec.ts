import { AuthService } from '@auth/application/auth.service.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway.js';

describe('NotificationsGateway', () => {
	let gateway: NotificationsGateway;

	const mockServer = {
		emit: vi.fn(),
	};

	const mockAuthService = {
		verifyToken: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [NotificationsGateway, { provide: AuthService, useValue: mockAuthService }],
		}).compile();

		gateway = module.get<NotificationsGateway>(NotificationsGateway);

		Object.defineProperty(gateway, 'server', {
			value: mockServer,
			writable: true,
		});
	});

	describe('notifyLocationCreated', () => {
		it('should broadcast location.created event with correct payload shape', () => {
			const payload = { locationId: 'loc-uuid-123', name: 'Board Game Café' };

			gateway.notifyLocationCreated(payload);

			expect(mockServer.emit).toHaveBeenCalledWith('location.created', payload);
			expect(mockServer.emit).toHaveBeenCalledWith(
				'location.created',
				expect.objectContaining({
					locationId: 'loc-uuid-123',
					name: 'Board Game Café',
				}),
			);
		});

		it('should include both locationId and name in the broadcast', () => {
			const payload = { locationId: 'loc-abc', name: 'Meeple HQ' };

			gateway.notifyLocationCreated(payload);

			const [, broadcastPayload] = mockServer.emit.mock.calls[0];
			expect(broadcastPayload).toHaveProperty('locationId');
			expect(broadcastPayload).toHaveProperty('name');
			expect(broadcastPayload.name).toBe('Meeple HQ');
		});
	});

	describe('notifyEventCreated', () => {
		it('should broadcast event.created event with correct payload shape', () => {
			const payload = {
				eventId: 'evt-uuid-456',
				title: 'Friday Night Catan',
				createdBy: 'user-abc',
			};

			gateway.notifyEventCreated(payload);

			expect(mockServer.emit).toHaveBeenCalledWith('event.created', payload);
			expect(mockServer.emit).toHaveBeenCalledWith(
				'event.created',
				expect.objectContaining({
					eventId: 'evt-uuid-456',
					title: 'Friday Night Catan',
				}),
			);
		});

		it('should include both eventId and title in the broadcast', () => {
			const payload = {
				eventId: 'evt-xyz',
				title: 'Weekend Warriors',
				createdBy: 'user-xyz',
			};

			gateway.notifyEventCreated(payload);

			const [, broadcastPayload] = mockServer.emit.mock.calls[0];
			expect(broadcastPayload).toHaveProperty('eventId');
			expect(broadcastPayload).toHaveProperty('title');
			expect(broadcastPayload.title).toBe('Weekend Warriors');
		});
	});
});
