import type { PaginationDto } from "@common/dto/pagination.dto.js";
import { ERROR_CODE } from "@common/error-codes";
import { DB_TOKEN, type DrizzleDb } from "@database/database.module.js";
import { bggGames } from "@database/schema/bgg-games.js";
import {
  games,
  type InsertGame,
  type SelectGame,
} from "@database/schema/games.js";
import type { GameStatus } from "@gamenight-hub/shared";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, count, eq, isNull } from "drizzle-orm";
import type { UpdatePersonalFieldsDto } from "../presentation/dto/update-personal-fields.dto.js";

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
    status?: GameStatus
  ): Promise<PaginatedGames> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      isNull(games.deletedAt),
      eq(games.createdBy, createdBy),
    ];
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
      .where(
        and(
          eq(games.id, id),
          eq(games.createdBy, createdBy),
          isNull(games.deletedAt)
        )
      );
    if (!game)
      throw new NotFoundException({
        code: ERROR_CODE.GAME_NOT_FOUND,
        message: `Game with id ${id} not found`,
      });

    return game;
  }

  async findOneEnriched(
    id: string,
    createdBy: string
  ): Promise<
    SelectGame & { bggRating: number | null; bggRank: number | null }
  > {
    const rows = await this.#db
      .select({
        game: games,
        bggRating: bggGames.avgRating,
        bggRank: bggGames.rank,
      })
      .from(games)
      .leftJoin(bggGames, eq(games.bggId, bggGames.id))
      .where(
        and(
          eq(games.id, id),
          eq(games.createdBy, createdBy),
          isNull(games.deletedAt)
        )
      );

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

  async findCollectionRecommendations(
    gameId: string,
    createdBy: string
  ): Promise<SelectGame[]> {
    const allGames = await this.#db
      .select()
      .from(games)
      .where(and(eq(games.createdBy, createdBy), isNull(games.deletedAt)));

    const currentGame = allGames.find((g) => g.id === gameId);
    if (!currentGame) return [];

    const others = allGames.filter((g) => g.id !== gameId);
    if (others.length === 0) return [];

    const currentCategories = new Set(currentGame.categories ?? []);

    const categoryMatches: SelectGame[] = [];
    const nonMatches: SelectGame[] = [];

    for (const game of others) {
      const hasOverlap = (game.categories ?? []).some((c) =>
        currentCategories.has(c)
      );
      if (hasOverlap) {
        categoryMatches.push(game);
      } else {
        nonMatches.push(game);
      }
    }

    const shuffled = (arr: SelectGame[]) =>
      arr
        .map((g) => ({ g, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ g }) => g);

    const first3 = shuffled(categoryMatches).slice(0, 3);
    const remaining = 3 - first3.length;
    const fillers = shuffled(nonMatches).slice(0, remaining);
    const slot1to3 = [...first3, ...fillers];

    const usedIds = new Set(slot1to3.map((g) => g.id));
    const pool = others.filter((g) => !usedIds.has(g.id));
    const slot4to5 = shuffled(pool).slice(0, 2);

    return [...slot1to3, ...slot4to5].slice(0, 5);
  }

  async update(
    id: string,
    updateData: UpdatePersonalFieldsDto,
    createdBy: string
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
