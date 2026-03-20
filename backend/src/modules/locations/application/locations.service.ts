import type { PaginationDto } from '@common/dto/pagination.dto.js';
import { type PaginatedResponse, paginate } from '@common/dto/pagination.dto.js';
import { ERROR_CODE } from '@common/error-codes';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { events } from '@database/schema/events.js';
import { type InsertLocation, locations, type SelectLocation } from '@database/schema/locations.js';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, between, count, eq, exists, inArray, isNull, sql } from 'drizzle-orm';
import { firstValueFrom } from 'rxjs';
import { LocationCreatedEvent } from '../domain/events/location-created.event.js';
import type {
	CreateLocationWithEventDto,
	UpdateLocationDto,
} from '../presentation/dto/create-location.dto.js';

export type NominatimResult = {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
	address?: { postcode?: string };
};

@Injectable()
export class LocationsService {
	readonly #logger = new Logger(LocationsService.name);
	readonly #db: DrizzleDb;
	readonly #eventEmitter: EventEmitter2;
	readonly #httpService: HttpService;

	constructor(
		@Inject(DB_TOKEN) db: DrizzleDb,
		@Inject(EventEmitter2) eventEmitter: EventEmitter2,
		@Inject(HttpService) httpService: HttpService,
	) {
		this.#db = db;
		this.#eventEmitter = eventEmitter;
		this.#httpService = httpService;
	}

	async create(dto: CreateLocationWithEventDto, createdBy: string): Promise<SelectLocation> {
		const { eventDate, ...locationData } = dto;

		const insertData: InsertLocation = {
			...locationData,
			createdBy,
		};

		const [location] = await this.#db
			.insert(locations)
			.values({ ...insertData, updatedAt: new Date() })
			.returning();

		try {
			this.#eventEmitter.emit(
				'location.created',
				new LocationCreatedEvent(
					location.id,
					location.name,
					location.address ?? undefined,
					location.capacity ?? undefined,
					eventDate,
					createdBy,
				),
			);
		} catch (err) {
			this.#logger.error('Failed to emit location.created event', err);
		}

		return location;
	}

	async findAll(pagination?: PaginationDto): Promise<PaginatedResponse<SelectLocation>> {
		const page = pagination?.page ?? 1;
		const limit = pagination?.limit ?? 20;
		const offset = (page - 1) * limit;
		const where = isNull(locations.deletedAt);

		const [data, [{ value: total }]] = await Promise.all([
			this.#db.select().from(locations).where(where).limit(limit).offset(offset),
			this.#db.select({ value: count() }).from(locations).where(where),
		]);

		return paginate(data, total, page, limit);
	}

	async findOne(id: string): Promise<SelectLocation> {
		const [location] = await this.#db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), isNull(locations.deletedAt)));

		if (!location)
			throw new NotFoundException({
				code: ERROR_CODE.LOCATION_NOT_FOUND,
				message: `Location with id ${id} not found`,
			});

		return location;
	}

	async update(id: string, dto: UpdateLocationDto, createdBy: string): Promise<SelectLocation> {
		const existing = await this.findOne(id);
		if (existing.createdBy !== createdBy)
			throw new ForbiddenException({
				code: ERROR_CODE.NOT_LOCATION_OWNER,
				message: 'You do not own this location',
			});

		const [updated] = await this.#db
			.update(locations)
			.set({ ...dto, updatedAt: new Date() })
			.where(and(eq(locations.id, id), eq(locations.createdBy, createdBy)))
			.returning();

		return updated;
	}

	async remove(id: string, createdBy: string): Promise<SelectLocation> {
		const existing = await this.findOne(id);
		if (existing.createdBy !== createdBy)
			throw new ForbiddenException({
				code: ERROR_CODE.NOT_LOCATION_OWNER,
				message: 'You do not own this location',
			});

		const now = new Date();

		await this.#db
			.update(locations)
			.set({ deletedAt: now })
			.where(and(eq(locations.id, id), eq(locations.createdBy, createdBy)));

		await this.#db
			.update(events)
			.set({ deletedAt: now })
			.where(and(eq(events.locationId, id), isNull(events.deletedAt)));

		return existing;
	}

	async geocode(query: string, limit = 5): Promise<NominatimResult[]> {
		if (!query?.trim()) return [];

		const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
		geocodeUrl.searchParams.set('format', 'json');
		geocodeUrl.searchParams.set('addressdetails', '1');
		geocodeUrl.searchParams.set('q', query.trim());
		geocodeUrl.searchParams.set('limit', String(limit));
		const url = geocodeUrl.toString();

		try {
			const { data } = await firstValueFrom(this.#httpService.get<NominatimResult[]>(url));
			return data;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.#logger.error(`Geocoding failed for "${query}": ${message}`);
			return [];
		}
	}

	async findInBounds(
		swLat: number,
		swLng: number,
		neLat: number,
		neLng: number,
		venueTypes?: string[],
	): Promise<SelectLocation[]> {
		const conditions = [
			isNull(locations.deletedAt),
			between(locations.latitude, swLat, neLat),
			between(locations.longitude, swLng, neLng),
			exists(
				this.#db
					.select({ n: sql`1` })
					.from(events)
					.where(and(eq(events.locationId, locations.id), isNull(events.deletedAt))),
			),
		];

		if (venueTypes?.length) {
			conditions.push(
				inArray(
					locations.venueType,
					venueTypes as ('cafe' | 'store' | 'home' | 'public_space' | 'other')[],
				),
			);
		}

		return this.#db
			.select()
			.from(locations)
			.where(and(...conditions));
	}
}
