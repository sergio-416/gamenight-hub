import { XP_CAPS, XP_FOUNDING, XP_GAME_REWARDS, XP_GAME_THRESHOLDS, XP_ONE_TIME_BONUSES, XP_SOLO_BONUS, XP_STREAK, XP_WEEKEND_MULTIPLIER } from '@gamenight-hub/shared';
import { XpCalculatorService } from './xp-calculator.service.js';

describe('XpCalculatorService', () => {
	let service: XpCalculatorService;

	beforeEach(() => {
		service = new XpCalculatorService();
	});

	describe('LEVEL_TABLE', () => {
		it('should have 10 levels', () => {
			expect(XpCalculatorService.LEVEL_TABLE).toHaveLength(10);
		});

		it('should start at level 1 with 0 XP', () => {
			expect(XpCalculatorService.LEVEL_TABLE[0].level).toBe(1);
			expect(XpCalculatorService.LEVEL_TABLE[0].xpRequired).toBe(0);
		});

		it('should end at level 10 with 65000 XP', () => {
			expect(XpCalculatorService.LEVEL_TABLE[9].level).toBe(10);
			expect(XpCalculatorService.LEVEL_TABLE[9].xpRequired).toBe(65000);
		});

		it('should be sorted by ascending xpRequired', () => {
			for (let i = 1; i < XpCalculatorService.LEVEL_TABLE.length; i++) {
				expect(XpCalculatorService.LEVEL_TABLE[i].xpRequired).toBeGreaterThan(
					XpCalculatorService.LEVEL_TABLE[i - 1].xpRequired,
				);
			}
		});
	});

	describe('calculateGameXp', () => {
		it.each([
			[0, XP_GAME_REWARDS.FIRST_GAMES_BONUS],
			[XP_GAME_THRESHOLDS.SMALL_COLLECTION - 1, XP_GAME_REWARDS.FIRST_GAMES_BONUS],
			[XP_GAME_THRESHOLDS.SMALL_COLLECTION, XP_GAME_REWARDS.SMALL_COLLECTION_BONUS],
			[XP_GAME_THRESHOLDS.MEDIUM_COLLECTION - 1, XP_GAME_REWARDS.SMALL_COLLECTION_BONUS],
			[XP_GAME_THRESHOLDS.MEDIUM_COLLECTION, XP_GAME_REWARDS.MEDIUM_COLLECTION_BONUS],
			[XP_GAME_THRESHOLDS.LARGE_COLLECTION - 1, XP_GAME_REWARDS.MEDIUM_COLLECTION_BONUS],
			[XP_GAME_THRESHOLDS.LARGE_COLLECTION, XP_GAME_REWARDS.LARGE_COLLECTION_BONUS],
			[100, XP_GAME_REWARDS.LARGE_COLLECTION_BONUS],
		])('monthlyCount=%i returns %i XP', (count, expected) => {
			expect(service.calculateGameXp(count)).toBe(expected);
		});
	});

	describe('calculateSoloBonus', () => {
		it.each([
			[0, 1, XP_SOLO_BONUS],
			[0, 2, 0],
			[1, 1, 0],
			[XP_GAME_THRESHOLDS.SMALL_COLLECTION, 1, 0],
		])('monthlyCount=%i, batchSize=%i returns %i', (monthlyCount, batchSize, expected) => {
			expect(service.calculateSoloBonus(monthlyCount, batchSize)).toBe(expected);
		});
	});

	describe('calculateBatchGameXp', () => {
		it('single game from empty month returns [FIRST_GAMES_BONUS]', () => {
			expect(service.calculateBatchGameXp(0, 1)).toEqual([XP_GAME_REWARDS.FIRST_GAMES_BONUS]);
		});

		it('3 games from empty month returns [FIRST_GAMES_BONUS x3]', () => {
			expect(service.calculateBatchGameXp(0, 3)).toEqual([XP_GAME_REWARDS.FIRST_GAMES_BONUS, XP_GAME_REWARDS.FIRST_GAMES_BONUS, XP_GAME_REWARDS.FIRST_GAMES_BONUS]);
		});

		it('2 games crossing tier boundary at count 4 returns [FIRST_GAMES_BONUS, SMALL_COLLECTION_BONUS]', () => {
			expect(service.calculateBatchGameXp(XP_GAME_THRESHOLDS.SMALL_COLLECTION - 1, 2)).toEqual([XP_GAME_REWARDS.FIRST_GAMES_BONUS, XP_GAME_REWARDS.SMALL_COLLECTION_BONUS]);
		});

		it('1 game at count 14 returns [SMALL_COLLECTION_BONUS]', () => {
			expect(service.calculateBatchGameXp(XP_GAME_THRESHOLDS.MEDIUM_COLLECTION - 1, 1)).toEqual([XP_GAME_REWARDS.SMALL_COLLECTION_BONUS]);
		});

		it('2 games crossing tier boundary at count 29 returns [MEDIUM_COLLECTION_BONUS, LARGE_COLLECTION_BONUS]', () => {
			expect(service.calculateBatchGameXp(XP_GAME_THRESHOLDS.LARGE_COLLECTION - 1, 2)).toEqual([XP_GAME_REWARDS.MEDIUM_COLLECTION_BONUS, XP_GAME_REWARDS.LARGE_COLLECTION_BONUS]);
		});

		it('0 batch size returns empty array', () => {
			expect(service.calculateBatchGameXp(0, 0)).toEqual([]);
		});
	});

	describe('getStreakMultiplier', () => {
		it.each([
			[0, XP_STREAK.BASE_MULTIPLIER],
			[XP_STREAK.APPRENTICE_WEEKS - 1, XP_STREAK.BASE_MULTIPLIER],
			[XP_STREAK.APPRENTICE_WEEKS, XP_STREAK.APPRENTICE_MULTIPLIER],
			[XP_STREAK.VETERAN_WEEKS - 1, XP_STREAK.APPRENTICE_MULTIPLIER],
			[XP_STREAK.VETERAN_WEEKS, XP_STREAK.VETERAN_MULTIPLIER],
			[XP_STREAK.LEGENDARY_WEEKS - 1, XP_STREAK.VETERAN_MULTIPLIER],
			[XP_STREAK.LEGENDARY_WEEKS, XP_STREAK.LEGENDARY_MULTIPLIER],
			[100, XP_STREAK.LEGENDARY_MULTIPLIER],
		])('streakWeeks=%i returns %f', (weeks, expected) => {
			expect(service.getStreakMultiplier(weeks)).toBe(expected);
		});
	});

	describe('getWeekendMultiplier', () => {
		it('returns BASE_MULTIPLIER for a weekday (Monday)', () => {
			const monday = new Date('2026-03-16T12:00:00Z');
			expect(service.getWeekendMultiplier(monday)).toBe(XP_STREAK.BASE_MULTIPLIER);
		});

		it('returns BASE_MULTIPLIER for a weekday (Wednesday)', () => {
			const wednesday = new Date('2026-03-18T12:00:00Z');
			expect(service.getWeekendMultiplier(wednesday)).toBe(XP_STREAK.BASE_MULTIPLIER);
		});

		it('returns XP_WEEKEND_MULTIPLIER for Saturday', () => {
			const saturday = new Date('2026-03-14T12:00:00Z');
			expect(service.getWeekendMultiplier(saturday)).toBe(XP_WEEKEND_MULTIPLIER);
		});

		it('returns XP_WEEKEND_MULTIPLIER for Sunday', () => {
			const sunday = new Date('2026-03-15T12:00:00Z');
			expect(service.getWeekendMultiplier(sunday)).toBe(XP_WEEKEND_MULTIPLIER);
		});
	});

	describe('getCombinedMultiplier', () => {
		it('returns BASE_MULTIPLIER for no streak on a weekday', () => {
			const weekday = new Date('2026-03-16T12:00:00Z');
			expect(service.getCombinedMultiplier(0, weekday)).toBe(XP_STREAK.BASE_MULTIPLIER);
		});

		it('returns streak * weekend for streak=VETERAN_WEEKS on Saturday', () => {
			const saturday = new Date('2026-03-14T12:00:00Z');
			expect(service.getCombinedMultiplier(XP_STREAK.VETERAN_WEEKS, saturday)).toBeCloseTo(XP_STREAK.VETERAN_MULTIPLIER * XP_WEEKEND_MULTIPLIER, 5);
		});

		it('returns LEGENDARY * WEEKEND for streak=LEGENDARY_WEEKS on Sunday', () => {
			const sunday = new Date('2026-03-15T12:00:00Z');
			expect(service.getCombinedMultiplier(XP_STREAK.LEGENDARY_WEEKS, sunday)).toBeCloseTo(XP_STREAK.LEGENDARY_MULTIPLIER * XP_WEEKEND_MULTIPLIER, 5);
		});
	});

	describe('applyDailyCap', () => {
		it('returns full base when no cap hit', () => {
			expect(service.applyDailyCap(75, 0, 0)).toBe(75);
		});

		it('caps at remaining action budget', () => {
			expect(service.applyDailyCap(75, XP_CAPS.ACTION_CAP - 50, 0)).toBe(50);
		});

		it('caps at remaining grand budget', () => {
			expect(service.applyDailyCap(75, 0, XP_CAPS.GRAND_CAP - 50)).toBe(50);
		});

		it('returns 0 when action cap fully spent', () => {
			expect(service.applyDailyCap(75, XP_CAPS.ACTION_CAP, 0)).toBe(0);
		});

		it('returns 0 when grand cap fully spent', () => {
			expect(service.applyDailyCap(75, 0, XP_CAPS.GRAND_CAP)).toBe(0);
		});

		it('picks tighter cap when grand is more restrictive', () => {
			expect(service.applyDailyCap(75, XP_CAPS.ACTION_CAP - 20, XP_CAPS.GRAND_CAP - 10)).toBe(10);
		});

		it('respects custom action cap', () => {
			expect(service.applyDailyCap(100, 0, 0, 50)).toBe(50);
		});

		it('respects custom grand cap', () => {
			expect(service.applyDailyCap(100, 0, 0, XP_CAPS.ACTION_CAP, 80)).toBe(80);
		});
	});

	describe('calculateFinalXp', () => {
		const weekday = new Date('2026-03-16T12:00:00Z');
		const saturday = new Date('2026-03-14T12:00:00Z');

		it('returns base XP with no multipliers', () => {
			expect(service.calculateFinalXp(75, 0, weekday)).toBe(75);
		});

		it('applies streak multiplier (floor(75 * 1.5) = 112)', () => {
			expect(service.calculateFinalXp(75, 7, weekday)).toBe(112);
		});

		it('applies both multipliers (floor(75 * 2.0 * 1.1) = 165)', () => {
			expect(service.calculateFinalXp(75, 30, saturday)).toBe(165);
		});

		it('returns 0 when base is 0 regardless of multipliers', () => {
			expect(service.calculateFinalXp(0, 30, saturday)).toBe(0);
		});

		it('floors fractional results', () => {
			expect(service.calculateFinalXp(10, 3, weekday)).toBe(12);
		});
	});

	describe('calculateLevel', () => {
		it.each([
			[0, 1],
			[249, 1],
			[250, 2],
			[750, 3],
			[2000, 4],
			[5000, 5],
			[10000, 6],
			[18000, 7],
			[30000, 8],
			[45000, 9],
			[64999, 9],
			[65000, 10],
			[100000, 10],
		])('totalXp=%i returns level %i', (xp, expectedLevel) => {
			expect(service.calculateLevel(xp).level).toBe(expectedLevel);
		});

		it('returns full LevelInfo shape', () => {
			const info = service.calculateLevel(5000);
			expect(info).toEqual({
				level: 5,
				title: 'Guild Member',
				tier: 'Enthusiast',
				xpRequired: 5000,
			});
		});
	});

	describe('getXpToNextLevel', () => {
		it('at 0 XP needs 250 for next level with 0% progress', () => {
			const result = service.getXpToNextLevel(0);
			expect(result.current.level).toBe(1);
			expect(result.next?.level).toBe(2);
			expect(result.xpNeeded).toBe(250);
			expect(result.progressPercent).toBe(0);
		});

		it('at 125 XP shows 50% progress through level 1', () => {
			const result = service.getXpToNextLevel(125);
			expect(result.current.level).toBe(1);
			expect(result.next?.level).toBe(2);
			expect(result.xpNeeded).toBe(125);
			expect(result.progressPercent).toBe(50);
		});

		it('at max level returns null next and 100% progress', () => {
			const result = service.getXpToNextLevel(65000);
			expect(result.current.level).toBe(10);
			expect(result.next).toBeNull();
			expect(result.xpNeeded).toBe(0);
			expect(result.progressPercent).toBe(100);
		});

		it('at exactly level 2 boundary returns 0% of level 2', () => {
			const result = service.getXpToNextLevel(250);
			expect(result.current.level).toBe(2);
			expect(result.next?.level).toBe(3);
			expect(result.xpNeeded).toBe(500);
			expect(result.progressPercent).toBe(0);
		});

		it('well above max level still returns level 10 at 100%', () => {
			const result = service.getXpToNextLevel(999999);
			expect(result.current.level).toBe(10);
			expect(result.next).toBeNull();
			expect(result.progressPercent).toBe(100);
		});
	});

	describe('checkOneTimeBonus', () => {
		it.each([
			['game_added', true, XP_ONE_TIME_BONUSES.game_added],
			['event_created', true, XP_ONE_TIME_BONUSES.event_created],
			['participant_joined', true, XP_ONE_TIME_BONUSES.participant_joined],
			['game_added', false, 0],
			['event_created', false, 0],
			['participant_joined', false, 0],
		])('action="%s", isFirst=%s returns %i', (action, isFirst, expected) => {
			expect(service.checkOneTimeBonus(action, isFirst)).toBe(expected);
		});

		it('returns 0 for unknown action even when isFirst', () => {
			expect(service.checkOneTimeBonus('unknown_action', true)).toBe(0);
		});
	});

	describe('isFoundingCollectionEligible', () => {
		const accountCreated = new Date('2026-03-01T00:00:00Z');

		it('returns true for threshold+ games within 24h', () => {
			const now = new Date('2026-03-01T23:00:00Z');
			expect(service.isFoundingCollectionEligible(accountCreated, XP_FOUNDING.COLLECTION_THRESHOLD, now)).toBe(true);
		});

		it('returns false for threshold-1 games within 24h', () => {
			const now = new Date('2026-03-01T23:00:00Z');
			expect(service.isFoundingCollectionEligible(accountCreated, XP_FOUNDING.COLLECTION_THRESHOLD - 1, now)).toBe(false);
		});

		it('returns false for threshold+ games after 24h window', () => {
			const now = new Date('2026-03-02T01:00:00Z');
			expect(service.isFoundingCollectionEligible(accountCreated, XP_FOUNDING.COLLECTION_THRESHOLD, now)).toBe(false);
		});

		it('returns true at exactly 24h boundary', () => {
			const now = new Date('2026-03-02T00:00:00Z');
			expect(service.isFoundingCollectionEligible(accountCreated, XP_FOUNDING.COLLECTION_THRESHOLD, now)).toBe(true);
		});

		it('returns true for well above threshold within window', () => {
			const now = new Date('2026-03-01T12:00:00Z');
			expect(service.isFoundingCollectionEligible(accountCreated, 50, now)).toBe(true);
		});
	});
});
