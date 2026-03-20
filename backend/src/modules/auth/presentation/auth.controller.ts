import { AuthService } from "@auth/application/auth.service";
import { ZodValidationPipe } from "@common/pipes/zod-validation.pipe";
import type { MagicLinkRequest } from "@gamenight-hub/shared";
import { MagicLinkRequestSchema } from "@gamenight-hub/shared";
import { EmailService } from "@modules/email/application/email.service";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UsePipes,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

const ACCEPTED_RESPONSE = {
  message: "If this email is registered, a sign-in link has been sent.",
} as const;

@Controller({ path: "auth", version: "1" })
export class AuthController {
  readonly #logger = new Logger(AuthController.name);
  readonly #authService: AuthService;
  readonly #emailService: EmailService;

  constructor(
    @Inject(AuthService) authService: AuthService,
    @Inject(EmailService) emailService: EmailService
  ) {
    this.#authService = authService;
    this.#emailService = emailService;
  }

  @Post("magic-link")
  @Throttle({ default: { ttl: 60000, limit: 3 } })
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
