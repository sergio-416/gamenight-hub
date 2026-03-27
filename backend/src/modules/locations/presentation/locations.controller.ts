import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { CurrentUser } from '@common/decorators/current-user.decorator.js';
import type { PaginationDto } from '@common/dto/pagination.dto.js';
import { PaginationSchema } from '@common/dto/pagination.dto.js';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe.js';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe.js';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { toLocationResponse } from '../application/location.sanitiser.js';
import type { NominatimResult } from '../application/locations.service.js';
import { LocationsService } from '../application/locations.service.js';
import type { CreateLocationWithEventDto, UpdateLocationDto } from './dto/create-location.dto.js';
import { CreateLocationWithEventSchema, UpdateLocationSchema } from './dto/create-location.dto.js';
import type { FindInBoundsDto } from './dto/find-in-bounds.dto.js';
import { FindInBoundsSchema } from './dto/find-in-bounds.dto.js';
import type { GeocodeDto } from './dto/geocode.dto.js';
import { GeocodeSchema } from './dto/geocode.dto.js';

@ApiTags('Locations')
@Controller({ path: 'locations', version: '1' })
export class LocationsController {
	readonly #locationsService: LocationsService;

	constructor(@Inject(LocationsService) locationsService: LocationsService) {
		this.#locationsService = locationsService;
	}

	@ApiOperation({ summary: 'Create a new game night location' })
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(FirebaseAuthGuard)
	async create(
		@Body(new ZodValidationPipe(CreateLocationWithEventSchema))
		dto: CreateLocationWithEventDto,
		@CurrentUser('uid') uid: string,
	) {
		return toLocationResponse(await this.#locationsService.create(dto, uid));
	}

	@ApiOperation({ summary: 'List all locations' })
	@Get()
	async findAll(@Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto) {
		const result = await this.#locationsService.findAll(pagination);
		return {
			...result,
			data: result.data.map(toLocationResponse),
		};
	}

	@ApiOperation({
		summary: 'Geocode an address via Nominatim (server-side proxy)',
	})
	@Get('geocode')
	geocode(
		@Query(new ZodValidationPipe(GeocodeSchema)) query: GeocodeDto,
	): Promise<NominatimResult[]> {
		return this.#locationsService.geocode(query.q, query.limit);
	}

	@ApiOperation({ summary: 'Find locations within map bounds' })
	@Get('bounds')
	async findInBounds(@Query(new ZodValidationPipe(FindInBoundsSchema)) query: FindInBoundsDto) {
		const types = query.venueType ? query.venueType.split(',') : [];

		const data = await this.#locationsService.findInBounds(
			query.swLat,
			query.swLng,
			query.neLat,
			query.neLng,
			types,
		);

		return data.map(toLocationResponse);
	}

	@ApiOperation({ summary: 'Get a location by ID' })
	@Get(':id')
	async findOne(@Param('id', ParseUuidPipe) id: string) {
		return toLocationResponse(await this.#locationsService.findOne(id));
	}

	@ApiOperation({ summary: 'Update a location' })
	@Patch(':id')
	@UseGuards(FirebaseAuthGuard)
	async update(
		@Param('id', ParseUuidPipe) id: string,
		@Body(new ZodValidationPipe(UpdateLocationSchema)) dto: UpdateLocationDto,
		@CurrentUser('uid') uid: string,
	) {
		return toLocationResponse(await this.#locationsService.update(id, dto, uid));
	}

	@ApiOperation({ summary: 'Soft-delete a location' })
	@Delete(':id')
	@UseGuards(FirebaseAuthGuard)
	async remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return toLocationResponse(await this.#locationsService.remove(id, uid));
	}
}
