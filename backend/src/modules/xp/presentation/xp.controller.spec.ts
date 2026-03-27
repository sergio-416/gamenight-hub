import { PAGINATION } from '@gamenight-hub/shared';
import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { XpService } from '../application/xp.service.js';
import { XpController } from './xp.controller.js';

const MOCK_UID = 'user-uid-123';

const makeXpProfile = (overrides = {}) => ({
	userId: MOCK_UID,
	xpTotal: 500,
	level: 2,
	streakWeeks: 3,
	lastActivityAt: new Date('2026-03-17'),
	levelTitle: 'Curious Collector',
	nextLevelXp: 750,
	xpToNextLevel: 250,
	progressPercent: 50,
	...overrides,
});

describe('XpController', () => {
	let controller: XpController;

	const mockXpService = {
		getProfile: vi.fn(),
		createProfile: vi.fn(),
		getHistory: vi.fn(),
		getStats: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [XpController],
			providers: [{ provide: XpService, useValue: mockXpService }],
		})
			.overrideGuard(FirebaseAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<XpController>(XpController);
	});

	describe('GET /xp/me', () => {
		it('should return XP profile data for authenticated user', async () => {
			const profile = makeXpProfile();
			mockXpService.getProfile.mockResolvedValue(profile);

			const result = await controller.getMyProfile(MOCK_UID);

			expect(result?.userId).toBe(MOCK_UID);
			expect(result?.xpTotal).toBe(500);
			expect(result?.levelTitle).toBe('Curious Collector');
			expect(mockXpService.getProfile).toHaveBeenCalledWith(MOCK_UID);
		});

		it('should auto-create XP profile when none exists', async () => {
			const profile = makeXpProfile();
			mockXpService.getProfile.mockResolvedValueOnce(null).mockResolvedValueOnce(profile);
			mockXpService.createProfile.mockResolvedValue(profile);

			const result = await controller.getMyProfile(MOCK_UID);

			expect(mockXpService.createProfile).toHaveBeenCalledWith(MOCK_UID);
			expect(result?.userId).toBe(MOCK_UID);
		});
	});

	describe('GET /xp/me/history', () => {
		it('should return paginated transaction history', async () => {
			const historyResult = {
				transactions: [
					{
						id: 'tx-1',
						action: 'game_added',
						baseXp: 75,
						multiplier: 1.0,
						finalXp: 75,
						metadata: {},
						createdAt: new Date(),
					},
				],
				total: 1,
			};
			mockXpService.getHistory.mockResolvedValue(historyResult);

			const result = await controller.getMyHistory(MOCK_UID, {
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
			});

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.page).toBe(PAGINATION.DEFAULT_PAGE);
			expect(result.limit).toBe(PAGINATION.DEFAULT_LIMIT);
			expect(result.totalPages).toBe(1);
			expect(mockXpService.getHistory).toHaveBeenCalledWith(MOCK_UID, PAGINATION.DEFAULT_PAGE, PAGINATION.DEFAULT_LIMIT);
		});

		it('should return empty history for user with no transactions', async () => {
			mockXpService.getHistory.mockResolvedValue({
				transactions: [],
				total: 0,
			});

			const result = await controller.getMyHistory(MOCK_UID, {
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
			});

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(0);
		});
	});

	describe('GET /xp/me/stats', () => {
		it('should return XP statistics for authenticated user', async () => {
			const stats = {
				monthlyXp: 300,
				weeklyXp: 150,
				totalTransactions: 10,
				currentStreak: 3,
				longestStreak: 5,
				topAction: 'game_added',
			};
			mockXpService.getStats.mockResolvedValue(stats);

			const result = await controller.getMyStats(MOCK_UID);

			expect(result.monthlyXp).toBe(300);
			expect(result.weeklyXp).toBe(150);
			expect(result.currentStreak).toBe(3);
			expect(result.topAction).toBe('game_added');
			expect(mockXpService.getStats).toHaveBeenCalledWith(MOCK_UID);
		});
	});
});
