import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { CurrentUser } from '@common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe.js';
import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type XpHistoryQuery, xpHistoryQuerySchema } from '../../../shared/schemas/xp.schema.js';
import { XpService } from '../application/xp.service.js';

@ApiTags('XP')
@Controller({ path: 'xp', version: '1' })
export class XpController {
	readonly #xpService: XpService;

	constructor(@Inject(XpService) xpService: XpService) {
		this.#xpService = xpService;
	}

	@ApiOperation({ summary: 'Get own XP profile' })
	@Get('me')
	@UseGuards(FirebaseAuthGuard)
	async getMyProfile(@CurrentUser('uid') uid: string) {
		let profile = await this.#xpService.getProfile(uid);
		if (!profile) {
			await this.#xpService.createProfile(uid);
			profile = await this.#xpService.getProfile(uid);
		}
		return profile;
	}

	@ApiOperation({ summary: 'Get own XP transaction history' })
	@Get('me/history')
	@UseGuards(FirebaseAuthGuard)
	async getMyHistory(
		@CurrentUser('uid') uid: string,
		@Query(new ZodValidationPipe(xpHistoryQuerySchema)) query: XpHistoryQuery,
	) {
		const { transactions, total } = await this.#xpService.getHistory(uid, query.page, query.limit);
		return {
			data: transactions,
			total,
			page: query.page,
			limit: query.limit,
			totalPages: Math.ceil(total / query.limit),
		};
	}

	@ApiOperation({ summary: 'Get own XP stats' })
	@Get('me/stats')
	@UseGuards(FirebaseAuthGuard)
	getMyStats(@CurrentUser('uid') uid: string) {
		return this.#xpService.getStats(uid);
	}
}
