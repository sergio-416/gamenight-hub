import type { PaginatedResponse, PaginationDto } from '@common/dto/pagination.dto.js';
import { paginate } from '@common/dto/pagination.dto.js';
import { ERROR_CODE } from '@common/error-codes';
import type { SelectGame } from '@database/schema/games.js';
import type { CheckPlayedGameResponse, GameStatus } from '@gamenight-hub/shared';
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameAddedEvent } from '../../xp/domain/xp-events.js';
import type { GameSearchResult } from '../domain/entities/game-search-result.entity.js';
import type { UpdatePersonalFieldsDto } from '../presentation/dto/update-personal-fields.dto.js';
import { BggCsvService } from './bgg-csv.service.js';
import { BggIntegrationService } from './bgg-integration.service.js';
import { GamesAnalyticsService } from './games-analytics.service.js';
import { GamesCrudService } from './games-crud.service.js';
import { UserPlayedGamesService } from './user-played-games.service.js';

@Injectable()
export class GamesService {
	readonly #logger = new Logger(GamesService.name);
	readonly #eventEmitter: EventEmitter2;

	constructor(
		@Inject(BggIntegrationService)
		private readonly bggService: BggIntegrationService,
		@Inject(BggCsvService) private readonly bggCsvService: BggCsvService,
		@Inject(GamesCrudService) private readonly crudService: GamesCrudService,
		@Inject(GamesAnalyticsService)
		private readonly analyticsService: GamesAnalyticsService,
		@Inject(UserPlayedGamesService)
		private readonly playedGamesService: UserPlayedGamesService,
		@Inject(EventEmitter2) eventEmitter: EventEmitter2,
	) {
		this.#eventEmitter = eventEmitter;
	}

	async checkIfPlayed(userId: string, gameId: string): Promise<CheckPlayedGameResponse> {
		return this.playedGamesService.checkIfPlayed(userId, gameId);
	}

	async checkIfPlayedByBggId(userId: string, bggId: number): Promise<CheckPlayedGameResponse> {
		return this.playedGamesService.checkIfPlayedByBggId(userId, bggId);
	}

	async importFromBgg(
		bggId: number,
		personalFields: UpdatePersonalFieldsDto,
		createdBy: string,
	): Promise<SelectGame> {
		const ownedBggIds = await this.crudService.findOwnedBggIds(createdBy);
		if (ownedBggIds.includes(bggId)) {
			throw new ConflictException({
				code: ERROR_CODE.GAME_ALREADY_IN_COLLECTION,
				message: 'This game is already in your collection',
			});
		}

		const playedCheck = await this.checkIfPlayedByBggId(createdBy, bggId);
		if (playedCheck.played) {
			throw new ConflictException({
				code: ERROR_CODE.GAME_ALREADY_PLAYED,
				message: 'This game is already in your played history',
				playedAt: playedCheck.playedAt,
			});
		}

		const bggDetails = await this.bggService.getGameDetails(bggId);

		const created = await this.crudService.create({
			...bggDetails,
			...personalFields,
			categories: bggDetails.categories,
			mechanics: bggDetails.mechanics,
			createdBy,
		});

		try {
			await this.#eventEmitter.emitAsync(
				'game.added',
				new GameAddedEvent(createdBy, created.id, created.name),
			);
		} catch (err) {
			this.#logger.error('Failed to emit game.added event', err);
		}

		return created;
	}

	async findAll(
		createdBy: string,
		pagination?: PaginationDto,
		status?: GameStatus,
	): Promise<PaginatedResponse<SelectGame>> {
		const { data, total } = await this.crudService.findAll(createdBy, pagination, status);
		return paginate(data, total, pagination?.page ?? 1, pagination?.limit ?? 20);
	}

	async findOne(id: string, createdBy: string): Promise<SelectGame> {
		return this.crudService.findOne(id, createdBy);
	}

	async findOneEnriched(id: string, createdBy: string) {
		const enriched = await this.crudService.findOneEnriched(id, createdBy);
		const recommendations = await this.crudService.findCollectionRecommendations(id, createdBy);
		return { ...enriched, recommendations };
	}

	async update(
		id: string,
		personalFields: UpdatePersonalFieldsDto,
		createdBy: string,
	): Promise<SelectGame> {
		return this.crudService.update(id, personalFields, createdBy);
	}

	async remove(id: string, createdBy: string): Promise<SelectGame> {
		return this.crudService.remove(id, createdBy);
	}

	async getStats(createdBy: string) {
		return this.analyticsService.getStats(createdBy);
	}

	async getOwnedBggIds(createdBy: string): Promise<number[]> {
		return this.crudService.findOwnedBggIds(createdBy);
	}

	async searchLocal(query: string): Promise<GameSearchResult[]> {
		const localResults = this.bggCsvService.search(query);

		if (localResults.length > 0) return localResults;

		try {
			const bggResults = await this.bggService.searchGames(query);
			return bggResults.slice(0, 50).map((result) => ({
				bggId: result.bggId,
				name: result.name,
				yearPublished: result.yearPublished,
				source: 'bgg' as const,
			}));
		} catch (error) {
			this.#logger.warn(
				`BGG fallback failed for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
			return [];
		}
	}

	async searchBgg(query: string) {
		return this.bggService.searchGames(query);
	}

	async getBggGameDetails(bggId: number) {
		return this.bggService.getGameDetails(bggId);
	}

	async markAsPlayed(userId: string, gameId: string) {
		return this.playedGamesService.markAsPlayed(userId, gameId);
	}

}
