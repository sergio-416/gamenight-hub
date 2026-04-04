import type { PaginationDto } from '@common/dto/pagination.dto.js';
import { ERROR_CODE } from '@common/error-codes';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { bggGames } from '@database/schema/bgg-games.js';
import { games, type InsertGame, type SelectGame } from '@database/schema/games.js';
import { type GameStatus, PAGINATION, UI } from '@gamenight-hub/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import type { UpdatePersonalFieldsDto } from '../presentation/dto/update-personal-fields.dto.js';

export interface PaginatedGames {
	data: SelectGame[];
	total: number;
}

@Injectable()
export class GamesCrudService {
	readonly #db: DrizzleDb;

	constructor(@Inject(DB_TOKEN) db: DrizzleDb) {
		this.#db = db;
	}

	async create(gameData: InsertGame): Promise<SelectGame> {
		const [created] = await this.#db
			.insert(games)
			.values({ ...gameData, updatedAt: new Date() })
			.returning();
		return created;
	}

	async findAll(
		createdBy: string,
		pagination?: PaginationDto,
		status?: GameStatus,
	): Promise<PaginatedGames> {
		const page = pagination?.page ?? PAGINATION.DEFAULT_PAGE;
		const limit = pagination?.limit ?? PAGINATION.DEFAULT_LIMIT;
		const offset = (page - 1) * limit;

		const conditions = [isNull(games.deletedAt), eq(games.createdBy, createdBy)];
		if (status) {
			conditions.push(eq(games.status, status));
		}
		const where = and(...conditions);

		const [data, [{ value: total }]] = await Promise.all([
			this.#db.select().from(games).where(where).limit(limit).offset(offset),
			this.#db.select({ value: count() }).from(games).where(where),
		]);

		return { data, total };
	}

	async findOne(id: string, createdBy: string): Promise<SelectGame> {
		const [game] = await this.#db
			.select()
			.from(games)
			.where(and(eq(games.id, id), eq(games.createdBy, createdBy), isNull(games.deletedAt)));
		if (!game)
			throw new NotFoundException({
				code: ERROR_CODE.GAME_NOT_FOUND,
				message: `Game with id ${id} not found`,
			});

		return game;
	}

	async findOneEnriched(
		id: string,
		createdBy: string,
	): Promise<SelectGame & { bggRating: number | null; bggRank: number | null }> {
		const rows = await this.#db
			.select({
				game: games,
				bggRating: bggGames.avgRating,
				bggRank: bggGames.rank,
			})
			.from(games)
			.leftJoin(bggGames, eq(games.bggId, bggGames.id))
			.where(and(eq(games.id, id), eq(games.createdBy, createdBy), isNull(games.deletedAt)));

		if (rows.length === 0) {
			throw new NotFoundException({
				code: ERROR_CODE.GAME_NOT_FOUND,
				message: `Game with id ${id} not found`,
			});
		}

		const row = rows[0];
		return {
			...row.game,
			bggRating: row.bggRating ? parseFloat(row.bggRating) : null,
			bggRank: row.bggRank ?? null,
		};
	}

	async findCollectionRecommendations(gameId: string, createdBy: string): Promise<SelectGame[]> {
		const [currentGame] = await this.#db
			.select({ categories: games.categories })
			.from(games)
			.where(and(eq(games.id, gameId), eq(games.createdBy, createdBy), isNull(games.deletedAt)));

		if (!currentGame) return [];

		const currentCategories = currentGame.categories ?? [];

		const categoryMatches =
			currentCategories.length > 0
				? await this.#db
						.select()
						.from(games)
						.where(
							and(
								eq(games.createdBy, createdBy),
								isNull(games.deletedAt),
								sql`${games.id} != ${gameId}`,
								sql`${games.categories} && ${currentCategories}`,
							),
						)
						.orderBy(sql`random()`)
						.limit(UI.RECOMMENDATIONS_FIRST)
				: [];

		const usedIds = categoryMatches.map((g) => g.id);
		const remaining = UI.RECOMMENDATIONS_TOTAL - categoryMatches.length;

		const fillers =
			remaining > 0
				? await this.#db
						.select()
						.from(games)
						.where(
							and(
								eq(games.createdBy, createdBy),
								isNull(games.deletedAt),
								sql`${games.id} != ${gameId}`,
								usedIds.length > 0
									? sql`${games.id} NOT IN (${sql.join(
											usedIds.map((id) => sql`${id}`),
											sql`, `,
										)})`
									: undefined,
							),
						)
						.orderBy(sql`random()`)
						.limit(remaining)
				: [];

		return [...categoryMatches, ...fillers];
	}

	async update(
		id: string,
		updateData: UpdatePersonalFieldsDto,
		createdBy: string,
	): Promise<SelectGame> {
		await this.findOne(id, createdBy);

		const [updated] = await this.#db
			.update(games)
			.set({ ...updateData, updatedAt: new Date() })
			.where(and(eq(games.id, id), eq(games.createdBy, createdBy)))
			.returning();

		return updated;
	}

	async findOwnedBggIds(createdBy: string): Promise<number[]> {
		const rows = await this.#db
			.select({ bggId: games.bggId })
			.from(games)
			.where(and(eq(games.createdBy, createdBy), isNull(games.deletedAt)));
		return rows.filter((r) => r.bggId !== null).map((r) => r.bggId as number);
	}

	async remove(id: string, createdBy: string): Promise<SelectGame> {
		const game = await this.findOne(id, createdBy);

		await this.#db
			.update(games)
			.set({ deletedAt: new Date() })
			.where(and(eq(games.id, id), eq(games.createdBy, createdBy)));

		return game;
	}
}
