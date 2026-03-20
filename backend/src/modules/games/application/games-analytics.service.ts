import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { games, type SelectGame } from '@database/schema/games.js';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class GamesAnalyticsService {
	constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

	async getStats(createdBy: string) {
		const rows: SelectGame[] = await this.db
			.select()
			.from(games)
			.where(and(isNull(games.deletedAt), eq(games.createdBy, createdBy)));

		const categoryCount = new Map<string, number>();
		for (const game of rows) {
			for (const category of game.categories ?? []) {
				categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
			}
		}

		const complexityCount = new Map<number, number>();
		for (const game of rows) {
			if (game.complexity) {
				complexityCount.set(game.complexity, (complexityCount.get(game.complexity) ?? 0) + 1);
			}
		}

		const growthData = new Map<string, number>();
		for (const game of rows) {
			const date = game.createdAt;
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			growthData.set(monthKey, (growthData.get(monthKey) ?? 0) + 1);
		}

		const sortedGrowth = Array.from(growthData.entries())
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([x, y]) => ({ x, y }));

		return {
			gamesByCategory: Array.from(categoryCount.entries()).map(([name, value]) => ({
				name,
				value,
			})),
			complexityDistribution: Array.from(complexityCount.entries()).map(([name, value]) => ({
				name: `${name} - ${this.#complexityLabel(name)}`,
				value,
			})),
			collectionGrowth: sortedGrowth,
			totalGames: rows.length,
		};
	}

	#complexityLabel(level: number): string {
		const labels: Record<number, string> = {
			1: 'Light',
			2: 'Light-Medium',
			3: 'Medium',
			4: 'Medium-Heavy',
			5: 'Heavy',
		};
		return labels[level] ?? 'Unknown';
	}
}
