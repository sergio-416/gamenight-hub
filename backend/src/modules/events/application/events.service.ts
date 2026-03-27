import { PAGINATION } from '@gamenight-hub/shared';
import { paginate } from '@common/dto/pagination.dto.js';
import { ERROR_CODE } from '@common/error-codes';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { events, type InsertEvent, type SelectEvent } from '@database/schema/events.js';
import { games } from '@database/schema/games.js';
import { locations } from '@database/schema/locations.js';
import { participants } from '@database/schema/participants.js';
import { profiles } from '@database/schema/profiles.js';
import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, count, eq, getTableColumns, gte, isNull, lte, sql } from 'drizzle-orm';
import { LocationsService } from '../../locations/application/locations.service.js';
import { EventCreatedEvent } from '../domain/events/event-created.event.js';
import type { CreateEventDto, UpdateEventDto } from '../presentation/dto/create-event.dto.js';
import type { FindEventsDto } from '../presentation/dto/event-filter.dto.js';
import { type EventListResponse, toEventListResponse, toEventDetailResponse } from './event.sanitiser.js';

@Injectable()
export class EventsService {
	readonly #logger = new Logger(EventsService.name);
	readonly #db: DrizzleDb;
	readonly #eventEmitter: EventEmitter2;
	readonly #locationsService: LocationsService;

	constructor(
		@Inject(DB_TOKEN) db: DrizzleDb,
		@Inject(EventEmitter2) eventEmitter: EventEmitter2,
		@Inject(LocationsService) locationsService: LocationsService,
	) {
		this.#db = db;
		this.#eventEmitter = eventEmitter;
		this.#locationsService = locationsService;
	}

	async create(dto: CreateEventDto, createdBy: string): Promise<SelectEvent> {
		let resolvedLocationId = dto.locationId;

		if (dto.location) {
			try {
				const createdLocation = await this.#locationsService.create(dto.location, createdBy);
				resolvedLocationId = createdLocation.id;
			} catch (err) {
				this.#logger.error('Failed to create inline location', err);
				throw err;
			}
		}

		if (!resolvedLocationId) {
			throw new BadRequestException({
				code: ERROR_CODE.LOCATION_REQUIRED,
				message: 'Either locationId or an inline location must be provided',
			});
		}

		const insertData: InsertEvent = {
			title: dto.title,
			locationId: resolvedLocationId,
			createdBy,
			gameId: dto.gameId ?? null,
			startTime: new Date(dto.startTime),
			endTime: dto.endTime ? new Date(dto.endTime) : null,
			maxPlayers: dto.maxPlayers ?? null,
			description: dto.description ?? null,
			color: dto.color ?? null,
			coverImage: dto.coverImage ?? null,
			category: dto.category ?? null,
		};

		const [created] = await this.#db
			.insert(events)
			.values({ ...insertData, updatedAt: new Date() })
			.returning();

		try {
			await this.#eventEmitter.emitAsync(
				'event.created',
				new EventCreatedEvent(created.id, created.title, created.createdBy),
			);
		} catch (err) {
			this.#logger.error('Failed to emit event.created event', err);
		}

		const { deletedAt, createdAt, updatedAt, ...response } = created;
		return response;
	}

	async findAll(dto?: FindEventsDto) {
		const page = dto?.page ?? PAGINATION.DEFAULT_PAGE;
		const limit = dto?.limit ?? PAGINATION.DEFAULT_LIMIT;
		const offset = (page - 1) * limit;
		const where = and(
			isNull(events.deletedAt),
			isNull(locations.deletedAt),
			dto?.from ? gte(events.startTime, new Date(dto.from)) : undefined,
			dto?.to ? lte(events.startTime, new Date(dto.to)) : undefined,
			dto?.category ? eq(events.category, dto.category) : undefined,
		);

		const [data, [{ value: total }]] = await Promise.all([
			this.#db
				.select({
					...getTableColumns(events),
					participantCount: sql<number>`cast((select count(*) from ${participants} where ${participants.eventId} = ${events.id} and ${participants.status} = 'joined') as int)`,
					gameThumbnailUrl: games.thumbnailUrl,
					gameImageUrl: games.imageUrl,
				})
				.from(events)
				.innerJoin(locations, eq(events.locationId, locations.id))
				.leftJoin(games, eq(events.gameId, games.id))
				.where(where)
				.orderBy(asc(events.startTime))
				.limit(limit)
				.offset(offset),
			this.#db
				.select({ value: count() })
				.from(events)
				.innerJoin(locations, eq(events.locationId, locations.id))
				.where(where),
		]);

		return paginate(data, total, page, limit);
	}

	async findOne(id: string) {
		const [event] = await this.#db
			.select({
				...getTableColumns(events),
				participantCount: sql<number>`cast((select count(*) from ${participants} where ${participants.eventId} = ${events.id} and ${participants.status} = 'joined') as int)`,
				gameThumbnailUrl: games.thumbnailUrl,
				gameImageUrl: games.imageUrl,
				gameName: games.name,
				gameComplexity: games.complexity,
				gamePlayingTime: games.playingTime,
				gameMinPlayers: games.minPlayers,
				gameMaxPlayers: games.maxPlayers,
				hostUsername: profiles.username,
				hostAvatar: profiles.avatar,
			})
			.from(events)
			.leftJoin(games, eq(events.gameId, games.id))
			.leftJoin(profiles, eq(events.createdBy, profiles.uid))
			.where(and(eq(events.id, id), isNull(events.deletedAt)));

		if (!event)
			throw new NotFoundException({
				code: ERROR_CODE.EVENT_NOT_FOUND,
				message: `Event with id ${id} not found`,
			});

		return event;
	}

	async update(id: string, dto: UpdateEventDto, createdBy: string): Promise<SelectEvent> {
		const existing = await this.findOne(id);
		if (existing.createdBy !== createdBy)
			throw new ForbiddenException({
				code: ERROR_CODE.NOT_EVENT_OWNER,
				message: 'You do not own this event',
			});

		const [updated] = await this.#db
			.update(events)
			.set({
				...dto,
				startTime: dto.startTime !== undefined ? new Date(dto.startTime) : undefined,
				endTime: dto.endTime !== undefined ? new Date(dto.endTime) : undefined,
				updatedAt: new Date(),
			})
			.where(and(eq(events.id, id), eq(events.createdBy, createdBy)))
			.returning();

		return updated;
	}

	async remove(id: string, createdBy: string): Promise<SelectEvent> {
		const existing = await this.findOne(id);
		if (existing.createdBy !== createdBy)
			throw new ForbiddenException({
				code: ERROR_CODE.NOT_EVENT_OWNER,
				message: 'You do not own this event',
			});

		await this.#db
			.update(events)
			.set({ deletedAt: new Date() })
			.where(and(eq(events.id, id), eq(events.createdBy, createdBy)));

		return existing;
	}
}
