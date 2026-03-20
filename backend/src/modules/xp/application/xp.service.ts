import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { type SelectXpProfile, xpProfiles } from '@database/schema/xp-profiles.js';
import { xpTransactions } from '@database/schema/xp-transactions.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import type {
	XpAction,
	XpAwardResult,
	XpEventPayload,
	XpProfile,
} from '../../../shared/types/xp.types.js';
import { XpCalculatorService } from '../xp-calculator.service.js';

function startOfDayUTC(date: Date): Date {
	const d = new Date(date);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function startOfWeekUTC(date: Date): Date {
	const d = new Date(date);
	const day = d.getUTCDay();
	const diff = day === 0 ? 6 : day - 1;
	d.setUTCDate(d.getUTCDate() - diff);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function startOfMonthUTC(date: Date): Date {
	const d = new Date(date);
	d.setUTCDate(1);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	return d.getUTCFullYear();
}

@Injectable()
export class XpService {
	readonly #logger = new Logger(XpService.name);
	readonly #db: DrizzleDb;
	readonly #eventEmitter: EventEmitter2;
	readonly #calculator: XpCalculatorService;

	constructor(
		@Inject(DB_TOKEN) db: DrizzleDb,
		@Inject(EventEmitter2) eventEmitter: EventEmitter2,
		@Inject(XpCalculatorService) calculator: XpCalculatorService,
	) {
		this.#db = db;
		this.#eventEmitter = eventEmitter;
		this.#calculator = calculator;
	}

	async createProfile(userId: string): Promise<SelectXpProfile> {
		await this.#db.insert(xpProfiles).values({ userId }).onConflictDoNothing();

		const [profile] = await this.#db.select().from(xpProfiles).where(eq(xpProfiles.userId, userId));

		return profile;
	}

	async getProfile(userId: string): Promise<XpProfile | null> {
		const [profile] = await this.#db.select().from(xpProfiles).where(eq(xpProfiles.userId, userId));

		if (!profile) return null;

		const progress = this.#calculator.getXpToNextLevel(profile.xpTotal);

		return {
			userId: profile.userId,
			xpTotal: profile.xpTotal,
			level: profile.level,
			streakWeeks: profile.streakWeeks,
			lastActivityAt: profile.lastActivityAt,
			levelTitle: progress.current.title,
			nextLevelXp: progress.next?.xpRequired ?? progress.current.xpRequired,
			xpToNextLevel: progress.xpNeeded,
			progressPercent: progress.progressPercent,
		};
	}

	async getHistory(
		userId: string,
		page: number,
		limit: number,
	): Promise<{
		transactions: Array<{
			id: string;
			action: XpAction;
			baseXp: number;
			multiplier: number;
			finalXp: number;
			metadata: Record<string, unknown>;
			createdAt: Date;
		}>;
		total: number;
	}> {
		const offset = (page - 1) * limit;

		const [rows, [{ value: total }]] = await Promise.all([
			this.#db
				.select({
					id: xpTransactions.id,
					action: xpTransactions.action,
					baseXp: xpTransactions.baseXp,
					multiplier: xpTransactions.multiplier,
					finalXp: xpTransactions.finalXp,
					metadata: xpTransactions.metadata,
					createdAt: xpTransactions.createdAt,
				})
				.from(xpTransactions)
				.where(eq(xpTransactions.userId, userId))
				.orderBy(desc(xpTransactions.createdAt))
				.limit(limit)
				.offset(offset),
			this.#db
				.select({ value: count() })
				.from(xpTransactions)
				.where(eq(xpTransactions.userId, userId)),
		]);

		const transactions = rows.map((r) => ({
			...r,
			multiplier: Number(r.multiplier),
			metadata: (r.metadata ?? {}) as Record<string, unknown>,
		}));

		return { transactions, total };
	}

	async getStats(userId: string) {
		const now = new Date();
		const monthStart = startOfMonthUTC(now);
		const weekStart = startOfWeekUTC(now);

		const [
			[{ value: monthlyXp }],
			[{ value: weeklyXp }],
			[{ value: totalTransactions }],
			topActionRows,
			profileRows,
		] = await Promise.all([
			this.#db
				.select({
					value: sql<number>`coalesce(sum(${xpTransactions.finalXp}), 0)::int`,
				})
				.from(xpTransactions)
				.where(and(eq(xpTransactions.userId, userId), gte(xpTransactions.createdAt, monthStart))),
			this.#db
				.select({
					value: sql<number>`coalesce(sum(${xpTransactions.finalXp}), 0)::int`,
				})
				.from(xpTransactions)
				.where(and(eq(xpTransactions.userId, userId), gte(xpTransactions.createdAt, weekStart))),
			this.#db
				.select({ value: count() })
				.from(xpTransactions)
				.where(eq(xpTransactions.userId, userId)),
			this.#db
				.select({
					action: xpTransactions.action,
					total: sql<number>`sum(${xpTransactions.finalXp})::int`,
				})
				.from(xpTransactions)
				.where(eq(xpTransactions.userId, userId))
				.groupBy(xpTransactions.action)
				.orderBy(desc(sql`sum(${xpTransactions.finalXp})`))
				.limit(1),
			this.#db.select().from(xpProfiles).where(eq(xpProfiles.userId, userId)),
		]);

		const profile = profileRows[0];

		return {
			monthlyXp,
			weeklyXp,
			totalTransactions,
			currentStreak: profile?.streakWeeks ?? 0,
			longestStreak: profile?.streakWeeks ?? 0,
			topAction: topActionRows[0]?.action ?? null,
		};
	}

	async awardXp(
		userId: string,
		action: XpAction,
		metadata: Record<string, unknown> = {},
	): Promise<XpAwardResult> {
		return this.#db.transaction(async (tx) => {
			let [profile] = await tx
				.select()
				.from(xpProfiles)
				.where(eq(xpProfiles.userId, userId))
				.for('update');

			if (!profile) {
				await tx.insert(xpProfiles).values({ userId }).onConflictDoNothing();

				[profile] = await tx
					.select()
					.from(xpProfiles)
					.where(eq(xpProfiles.userId, userId))
					.for('update');
			}

			const now = new Date();
			let monthlyGameAdds = profile.monthlyGameAdds;
			const resetAt = profile.monthlyGameAddsResetAt;
			if (
				resetAt.getUTCFullYear() < now.getUTCFullYear() ||
				resetAt.getUTCMonth() < now.getUTCMonth()
			) {
				monthlyGameAdds = 0;
			}

			const todayStart = startOfDayUTC(now);

			const [{ value: dailyActionSpent }] = await tx
				.select({
					value: sql<number>`coalesce(sum(${xpTransactions.finalXp}), 0)::int`,
				})
				.from(xpTransactions)
				.where(
					and(
						eq(xpTransactions.userId, userId),
						eq(xpTransactions.action, action),
						gte(xpTransactions.createdAt, todayStart),
					),
				);

			const [{ value: dailyGrandSpent }] = await tx
				.select({
					value: sql<number>`coalesce(sum(${xpTransactions.finalXp}), 0)::int`,
				})
				.from(xpTransactions)
				.where(and(eq(xpTransactions.userId, userId), gte(xpTransactions.createdAt, todayStart)));

			let baseXp: number;
			switch (action) {
				case 'game_added':
					baseXp = this.#calculator.calculateGameXp(monthlyGameAdds);
					break;
				case 'event_created':
					baseXp = 75;
					break;
				case 'participant_joined':
					baseXp = 40;
					break;
				default:
					baseXp = 0;
			}

			const cappedBase = this.#calculator.applyDailyCap(baseXp, dailyActionSpent, dailyGrandSpent);

			const finalXp = this.#calculator.calculateFinalXp(cappedBase, profile.streakWeeks, now);

			const multiplier = this.#calculator.getCombinedMultiplier(profile.streakWeeks, now);

			const [transaction] = await tx
				.insert(xpTransactions)
				.values({
					userId,
					action,
					baseXp: cappedBase,
					multiplier: multiplier.toFixed(4),
					finalXp,
					metadata,
					dailyActionTotal: dailyActionSpent + finalXp,
					dailyGrandTotal: dailyGrandSpent + finalXp,
				})
				.returning();

			const newXpTotal = profile.xpTotal + finalXp;
			const oldLevel = profile.level;
			const newLevelInfo = this.#calculator.calculateLevel(newXpTotal);

			const streakResult = this.#updateStreak(profile, now);

			const newMonthlyGameAdds = action === 'game_added' ? monthlyGameAdds + 1 : monthlyGameAdds;

			await tx
				.update(xpProfiles)
				.set({
					xpTotal: newXpTotal,
					level: newLevelInfo.level,
					streakWeeks: streakResult.streakWeeks,
					lastActivityAt: now,
					monthlyGameAdds: newMonthlyGameAdds,
					monthlyGameAddsResetAt:
						monthlyGameAdds === 0 && newMonthlyGameAdds > 0 ? now : profile.monthlyGameAddsResetAt,
					updatedAt: now,
				})
				.where(eq(xpProfiles.userId, userId));

			const levelUp = newLevelInfo.level > oldLevel;

			const payload: XpEventPayload = {
				userId,
				action,
				xpAwarded: finalXp,
				newTotal: newXpTotal,
				levelUp,
				newLevel: levelUp ? newLevelInfo.level : undefined,
			};

			try {
				this.#eventEmitter.emit('xp.awarded', payload);
				if (levelUp) {
					this.#eventEmitter.emit('xp.level-up', payload);
				}
			} catch (err) {
				this.#logger.error('Failed to emit XP event', err);
			}

			return {
				awarded: finalXp > 0,
				transaction: {
					id: transaction.id,
					action: transaction.action as XpAction,
					baseXp: transaction.baseXp,
					multiplier: Number(transaction.multiplier),
					finalXp: transaction.finalXp,
					metadata: (transaction.metadata ?? {}) as Record<string, unknown>,
					createdAt: transaction.createdAt,
				},
				levelUp,
				newLevel: levelUp ? newLevelInfo.level : undefined,
				xpAwarded: finalXp,
			};
		});
	}

	#updateStreak(
		profile: SelectXpProfile,
		now: Date,
	): { streakWeeks: number; lastActivityAt: Date } {
		if (!profile.lastActivityAt) {
			return { streakWeeks: 1, lastActivityAt: now };
		}

		const lastWeek = getISOWeek(profile.lastActivityAt);
		const lastYear = getISOWeekYear(profile.lastActivityAt);
		const currentWeek = getISOWeek(now);
		const currentYear = getISOWeekYear(now);

		if (lastYear === currentYear && lastWeek === currentWeek) {
			return { streakWeeks: profile.streakWeeks, lastActivityAt: now };
		}

		const lastTotal = lastYear * 52 + lastWeek;
		const currentTotal = currentYear * 52 + currentWeek;

		if (currentTotal - lastTotal === 1) {
			return { streakWeeks: profile.streakWeeks + 1, lastActivityAt: now };
		}

		return { streakWeeks: 1, lastActivityAt: now };
	}
}
