import { AdminGuard } from '@auth/infrastructure/guards/admin.guard.js';
import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { StoreOrganiserGuard } from '@auth/infrastructure/guards/store-organiser.guard.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { StatsService } from '../application/stats.service.js';
import { StatsController } from './stats.controller.js';

const ORGANISER_UID = 'organiser-uid-123';

describe('StatsController', () => {
	let controller: StatsController;

	const mockStatsService = {
		getOrganiserStats: vi.fn(),
		getAdminStats: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [StatsController],
			providers: [{ provide: StatsService, useValue: mockStatsService }],
		})
			.overrideGuard(FirebaseAuthGuard)
			.useValue({ canActivate: () => true })
			.overrideGuard(AdminGuard)
			.useValue({ canActivate: () => true })
			.overrideGuard(StoreOrganiserGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<StatsController>(StatsController);
	});

	describe('GET /stats/organiser', () => {
		it('should delegate to statsService.getOrganiserStats() with caller uid', async () => {
			const expected = {
				eventsHosted: 5,
				totalAttendees: 40,
				popularGames: [{ name: 'Catan', eventCount: 3 }],
			};
			mockStatsService.getOrganiserStats.mockResolvedValue(expected);

			const result = await controller.getOrganiserStats(ORGANISER_UID);

			expect(result).toEqual(expected);
			expect(mockStatsService.getOrganiserStats).toHaveBeenCalledWith(ORGANISER_UID);
		});
	});

	describe('GET /stats/admin', () => {
		it('should delegate to statsService.getAdminStats()', async () => {
			const expected = {
				totalUsers: 100,
				totalEvents: 50,
				totalGames: 200,
			};
			mockStatsService.getAdminStats.mockResolvedValue(expected);

			const result = await controller.getAdminStats();

			expect(result).toEqual(expected);
			expect(mockStatsService.getAdminStats).toHaveBeenCalled();
		});
	});
});
