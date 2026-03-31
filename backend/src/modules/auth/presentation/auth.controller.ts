import { AuthService } from '@auth/application/auth.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import type { MagicLinkRequest } from '@gamenight-hub/shared';
import { MagicLinkRequestSchema, THROTTLE } from '@gamenight-hub/shared';
import { EmailService } from '@modules/email/application/email.service';
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Logger,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

const ACCEPTED_RESPONSE = {
	message: 'If this email is registered, a sign-in link has been sent.',
} as const;

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
	readonly #logger = new Logger(AuthController.name);
	readonly #authService: AuthService;
	readonly #emailService: EmailService;

	constructor(
		@Inject(AuthService) authService: AuthService,
		@Inject(EmailService) emailService: EmailService,
	) {
		this.#authService = authService;
		this.#emailService = emailService;
	}

	@ApiOperation({ summary: 'Request a magic link sign-in email' })
	@Post('magic-link')
	@Throttle({ default: { ttl: THROTTLE.WINDOW_MS, limit: THROTTLE.MAGIC_LINK_LIMIT } })
	@HttpCode(HttpStatus.ACCEPTED)
	@UsePipes(new ZodValidationPipe(MagicLinkRequestSchema))
	async requestMagicLink(@Body() body: MagicLinkRequest) {
		try {
			const link = await this.#authService.generateMagicLink(body.email);
			await this.#emailService.sendMagicLink(body.email, link);
		} catch (err) {
			this.#logger.error(`Magic link request failed for ${body.email}: ${err}`);
		}

		return ACCEPTED_RESPONSE;
	}
}
