import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { CurrentUser } from '@common/decorators/current-user.decorator.js';
import type { PaginationDto } from '@common/dto/pagination.dto.js';
import { PaginationSchema } from '@common/dto/pagination.dto.js';
import { ParseIntPipe } from '@common/pipes/parse-int.pipe.js';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe.js';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe.js';
import type { GameStatus } from '@gamenight-hub/shared';
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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { GamesService } from '../application/games.service.js';
import type { UpdatePersonalFieldsDto } from './dto/update-personal-fields.dto.js';
import { UpdatePersonalFieldsSchema } from './dto/update-personal-fields.dto.js';

@ApiTags('Games')
@Controller({ path: 'games', version: '1' })
export class GamesController {
	constructor(@Inject(GamesService) private readonly gamesService: GamesService) {}

	@ApiOperation({
		summary: 'Search games with fuzzy matching and BGG fallback',
	})
	@Get('search')
	@UseGuards(FirebaseAuthGuard)
	@Throttle({ default: { ttl: 60000, limit: 30 } })
	async searchLocal(
		@Query('query', new ZodValidationPipe(z.string().min(1).max(200)))
		query: string,
	) {
		return this.gamesService.searchLocal(query);
	}

	@ApiOperation({ summary: 'Search games on BoardGameGeek' })
	@Get('bgg/search')
	@UseGuards(FirebaseAuthGuard)
	@Throttle({ default: { ttl: 60000, limit: 20 } })
	async searchBgg(
		@Query('query', new ZodValidationPipe(z.string().min(1).max(200)))
		query: string,
	) {
		return this.gamesService.searchBgg(query);
	}

	@ApiOperation({ summary: 'Get full game details from BoardGameGeek' })
	@Get('bgg/game/:bggId')
	@UseGuards(FirebaseAuthGuard)
	@Throttle({ default: { ttl: 60000, limit: 20 } })
	async getBggGameDetails(@Param('bggId', ParseIntPipe) bggId: number) {
		return this.gamesService.getBggGameDetails(bggId);
	}

	@ApiOperation({ summary: 'Get collection statistics for current user' })
	@Get('stats')
	@UseGuards(FirebaseAuthGuard)
	async getStats(@CurrentUser('uid') uid: string) {
		return this.gamesService.getStats(uid);
	}

	@ApiOperation({ summary: 'Import a game from BoardGameGeek' })
	@Post('import/:bggId')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(FirebaseAuthGuard)
	async importGame(
		@Param('bggId', ParseIntPipe) bggId: number,
		@Body(new ZodValidationPipe(UpdatePersonalFieldsSchema))
		personalFields: UpdatePersonalFieldsDto,
		@CurrentUser('uid') uid: string,
	) {
		return this.gamesService.importFromBgg(bggId, personalFields, uid);
	}

	@ApiOperation({ summary: 'Get bggIds of all games in user collection' })
	@Get('owned-bgg-ids')
	@UseGuards(FirebaseAuthGuard)
	async getOwnedBggIds(@CurrentUser('uid') uid: string) {
		return this.gamesService.getOwnedBggIds(uid);
	}

	@ApiOperation({ summary: 'List all games in user collection' })
	@Get()
	@UseGuards(FirebaseAuthGuard)
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['owned', 'want_to_play', 'want_to_try', 'played'],
	})
	async findAll(
		@CurrentUser('uid') uid: string,
		@Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
		@Query('status') status?: GameStatus,
	) {
		return this.gamesService.findAll(uid, pagination, status);
	}

	@ApiOperation({
		summary: 'Get enriched game with BGG stats and recommendations',
	})
	@Get(':id/enriched')
	@UseGuards(FirebaseAuthGuard)
	async findOneEnriched(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return this.gamesService.findOneEnriched(id, uid);
	}

	@ApiOperation({ summary: 'Get a game by ID' })
	@Get(':id')
	@UseGuards(FirebaseAuthGuard)
	async findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return this.gamesService.findOne(id, uid);
	}

	@ApiOperation({ summary: 'Mark a game as played' })
	@Post(':id/mark-played')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(FirebaseAuthGuard)
	async markAsPlayed(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return this.gamesService.markAsPlayed(uid, id);
	}

	@ApiOperation({ summary: 'Check if a game has been played' })
	@Get(':id/check-played')
	@UseGuards(FirebaseAuthGuard)
	async checkPlayed(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return this.gamesService.checkIfPlayed(uid, id);
	}

	@ApiOperation({ summary: 'Update personal fields on a game' })
	@Patch(':id')
	@UseGuards(FirebaseAuthGuard)
	async update(
		@Param('id', ParseUuidPipe) id: string,
		@Body(new ZodValidationPipe(UpdatePersonalFieldsSchema))
		personalFields: UpdatePersonalFieldsDto,
		@CurrentUser('uid') uid: string,
	) {
		return this.gamesService.update(id, personalFields, uid);
	}

	@ApiOperation({ summary: 'Soft-delete a game' })
	@Delete(':id')
	@UseGuards(FirebaseAuthGuard)
	async remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser('uid') uid: string) {
		return this.gamesService.remove(id, uid);
	}
}
