import { ERROR_CODE } from "@common/error-codes";
import { DB_TOKEN, type DrizzleDb } from "@database/database.module.js";
import {
  games,
  type SelectUserPlayedGame,
  userPlayedGames,
} from "@database/schema/index.js";
import type { CheckPlayedGameResponse } from "@gamenight-hub/shared";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";

@Injectable()
export class UserPlayedGamesService {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  async markAsPlayed(
    userId: string,
    gameId: string
  ): Promise<SelectUserPlayedGame> {
    const [game] = await this.db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.createdBy, userId)))
      .limit(1);

    if (!game) {
      throw new NotFoundException({
        code: ERROR_CODE.GAME_NOT_FOUND,
        message: "Game not found",
      });
    }

    const [existing] = await this.db
      .select()
      .from(userPlayedGames)
      .where(
        and(
          eq(userPlayedGames.userId, userId),
          eq(userPlayedGames.gameId, gameId)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictException({
        code: ERROR_CODE.GAME_ALREADY_PLAYED,
        message: "Game already marked as played",
        playedAt: existing.playedAt,
      });
    }

    const [playedRecord] = await this.db
      .insert(userPlayedGames)
      .values({
        userId,
        gameId,
        playedAt: new Date(),
      })
      .returning();

    await this.db
      .delete(games)
      .where(and(eq(games.id, gameId), eq(games.createdBy, userId)));

    return playedRecord;
  }

  async checkIfPlayed(
    userId: string,
    gameId: string
  ): Promise<CheckPlayedGameResponse> {
    const [record] = await this.db
      .select()
      .from(userPlayedGames)
      .where(
        and(
          eq(userPlayedGames.userId, userId),
          eq(userPlayedGames.gameId, gameId)
        )
      )
      .limit(1);

    return {
      played: !!record,
      playedAt: record?.playedAt ?? null,
    };
  }

  async checkIfPlayedByBggId(
    userId: string,
    bggId: number
  ): Promise<CheckPlayedGameResponse> {
    const [game] = await this.db
      .select()
      .from(games)
      .where(and(eq(games.bggId, bggId), eq(games.createdBy, userId)))
      .limit(1);

    if (!game) {
      return { played: false, playedAt: null };
    }

    return this.checkIfPlayed(userId, game.id);
  }

  async getPlayedGames(userId: string): Promise<SelectUserPlayedGame[]> {
    return this.db
      .select()
      .from(userPlayedGames)
      .where(eq(userPlayedGames.userId, userId))
      .orderBy(desc(userPlayedGames.playedAt));
  }
}
