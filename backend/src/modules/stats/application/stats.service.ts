import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { events } from '@database/schema/events.js';
import { games } from '@database/schema/games.js';
import { profiles } from '@database/schema/profiles.js';
import { type AdminStatsDto, type OrganiserStatsDto, UI } from '@gamenight-hub/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, sql, sum } from 'drizzle-orm';

@Injectable()
export class StatsService {
	constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

	async getAdminStats(): Promise<AdminStatsDto> {
		const [{ value: totalUsers }] = await this.db.select({ value: count() }).from(profiles);

		const [{ value: totalEvents }] = await this.db
			.select({ value: count() })
			.from(events)
			.where(isNull(events.deletedAt));

		const [{ value: totalGames }] = await this.db
			.select({ value: count() })
			.from(games)
			.where(isNull(games.deletedAt));

		return { totalUsers, totalEvents, totalGames };
	}

	async getOrganiserStats(uid: string): Promise<OrganiserStatsDto> {
		const [{ value: eventsHosted }] = await this.db
			.select({ value: count() })
			.from(events)
			.where(and(eq(events.createdBy, uid), isNull(events.deletedAt)));

		const [{ value: totalAttendees }] = await this.db
			.select({ value: sum(events.maxPlayers) })
			.from(events)
			.where(and(eq(events.createdBy, uid), isNull(events.deletedAt)));

		const popularGames = await this.db
			.select({
				name: games.name,
				eventCount: count(),
			})
			.from(events)
			.where(and(eq(events.createdBy, uid), isNull(events.deletedAt)))
			.groupBy(games.name)
			.orderBy(sql`count() desc`)
			.limit(UI.POPULAR_GAMES_LIMIT);

		return {
			eventsHosted,
			totalAttendees: Number(totalAttendees ?? 0),
			popularGames: popularGames.map((g) => ({
				name: g.name ?? 'Unknown',
				eventCount: g.eventCount,
			})),
		};
	}
}
