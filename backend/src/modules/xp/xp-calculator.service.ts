import {
	DAY,
	XP_CAPS,
	XP_FOUNDING,
	XP_GAME_REWARDS,
	XP_GAME_THRESHOLDS,
	XP_ONE_TIME_BONUSES,
	XP_SOLO_BONUS,
	XP_STREAK,
	XP_WEEKEND_MULTIPLIER,
} from '@gamenight-hub/shared';
import { Injectable } from '@nestjs/common';

export interface LevelInfo {
	level: number;
	title: string;
	tier: string;
	xpRequired: number;
}

export interface LevelProgress {
	current: LevelInfo;
	next: LevelInfo | null;
	xpNeeded: number;
	progressPercent: number;
}

const LEVEL_TABLE: readonly LevelInfo[] = [
	{ level: 1, title: 'Wandering Pawn', tier: 'Novice', xpRequired: 0 },
	{ level: 2, title: 'Curious Collector', tier: 'Novice', xpRequired: 250 },
	{ level: 3, title: 'Apprentice Archivist', tier: 'Novice', xpRequired: 750 },
	{ level: 4, title: 'Tavern Regular', tier: 'Enthusiast', xpRequired: 2000 },
	{ level: 5, title: 'Guild Member', tier: 'Enthusiast', xpRequired: 5000 },
	{
		level: 6,
		title: 'Seasoned Strategist',
		tier: 'Enthusiast',
		xpRequired: 10000,
	},
	{ level: 7, title: 'Lorekeeper', tier: 'Veteran', xpRequired: 18000 },
	{
		level: 8,
		title: 'Knight of the Table',
		tier: 'Veteran',
		xpRequired: 30000,
	},
	{ level: 9, title: 'High Chamberlain', tier: 'Veteran', xpRequired: 45000 },
	{
		level: 10,
		title: 'Archmage of the Table',
		tier: 'Legendary',
		xpRequired: 65000,
	},
] as const;

@Injectable()
export class XpCalculatorService {
	static readonly LEVEL_TABLE = LEVEL_TABLE;

	calculateGameXp(monthlyCount: number): number {
		if (monthlyCount < XP_GAME_THRESHOLDS.SMALL_COLLECTION)
			return XP_GAME_REWARDS.FIRST_GAMES_BONUS;
		if (monthlyCount < XP_GAME_THRESHOLDS.MEDIUM_COLLECTION)
			return XP_GAME_REWARDS.SMALL_COLLECTION_BONUS;
		if (monthlyCount < XP_GAME_THRESHOLDS.LARGE_COLLECTION)
			return XP_GAME_REWARDS.MEDIUM_COLLECTION_BONUS;
		return XP_GAME_REWARDS.LARGE_COLLECTION_BONUS;
	}

	calculateSoloBonus(monthlyCount: number, batchSize: number): number {
		return monthlyCount === 0 && batchSize === 1 ? XP_SOLO_BONUS : 0;
	}

	calculateBatchGameXp(monthlyCount: number, batchSize: number): number[] {
		const results: number[] = [];
		let current = monthlyCount;
		for (let i = 0; i < batchSize; i++) {
			results.push(this.calculateGameXp(current));
			current++;
		}
		return results;
	}

	getStreakMultiplier(streakWeeks: number): number {
		if (streakWeeks >= XP_STREAK.LEGENDARY_WEEKS) return XP_STREAK.LEGENDARY_MULTIPLIER;
		if (streakWeeks >= XP_STREAK.VETERAN_WEEKS) return XP_STREAK.VETERAN_MULTIPLIER;
		if (streakWeeks >= XP_STREAK.APPRENTICE_WEEKS) return XP_STREAK.APPRENTICE_MULTIPLIER;
		return XP_STREAK.BASE_MULTIPLIER;
	}

	getWeekendMultiplier(date: Date): number {
		const day = date.getUTCDay();
		return day === DAY.SUNDAY || day === DAY.SATURDAY
			? XP_WEEKEND_MULTIPLIER
			: XP_STREAK.BASE_MULTIPLIER;
	}

	getCombinedMultiplier(streakWeeks: number, date: Date): number {
		return this.getStreakMultiplier(streakWeeks) * this.getWeekendMultiplier(date);
	}

	applyDailyCap(
		baseXp: number,
		dailyActionSpent: number,
		dailyGrandSpent: number,
		actionCap: number = XP_CAPS.ACTION_CAP,
		grandCap: number = XP_CAPS.GRAND_CAP,
	): number {
		const remainingAction = Math.max(0, actionCap - dailyActionSpent);
		const remainingGrand = Math.max(0, grandCap - dailyGrandSpent);
		return Math.min(baseXp, remainingAction, remainingGrand);
	}

	calculateFinalXp(cappedBaseXp: number, streakWeeks: number, date: Date): number {
		return Math.floor(cappedBaseXp * this.getCombinedMultiplier(streakWeeks, date));
	}

	calculateLevel(totalXp: number): LevelInfo {
		for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
			if (totalXp >= LEVEL_TABLE[i].xpRequired) {
				return LEVEL_TABLE[i];
			}
		}
		return LEVEL_TABLE[0];
	}

	getXpToNextLevel(totalXp: number): LevelProgress {
		const current = this.calculateLevel(totalXp);
		const nextIndex = LEVEL_TABLE.findIndex((l) => l.level === current.level + 1);

		if (nextIndex === -1) {
			return { current, next: null, xpNeeded: 0, progressPercent: 100 };
		}

		const next = LEVEL_TABLE[nextIndex];
		const xpNeeded = next.xpRequired - totalXp;
		const levelSpan = next.xpRequired - current.xpRequired;
		const progressPercent = Math.floor(((totalXp - current.xpRequired) / levelSpan) * 100);

		return { current, next, xpNeeded, progressPercent };
	}

	checkOneTimeBonus(action: string, isFirst: boolean): number {
		if (!isFirst) return 0;
		return XP_ONE_TIME_BONUSES[action] ?? 0;
	}

	isFoundingCollectionEligible(accountCreatedAt: Date, gameCount: number, now: Date): boolean {
		if (gameCount < XP_FOUNDING.COLLECTION_THRESHOLD) return false;
		const elapsed = now.getTime() - accountCreatedAt.getTime();
		return elapsed <= XP_FOUNDING.WINDOW_MS;
	}
}
