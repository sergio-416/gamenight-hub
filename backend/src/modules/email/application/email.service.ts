import { ERROR_CODE } from "@common/error-codes";
import { ResendProvider } from "@modules/email/infrastructure/resend.provider";
import { renderMagicLinkEmail } from "@modules/email/templates/magic-link.template";
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EmailService {
  readonly #logger = new Logger(EmailService.name);
  readonly #resendProvider: ResendProvider;
  readonly #configService: ConfigService;

  constructor(
    @Inject(ResendProvider) resendProvider: ResendProvider,
    @Inject(ConfigService) configService: ConfigService
  ) {
    this.#resendProvider = resendProvider;
    this.#configService = configService;
  }

  async sendMagicLink(email: string, link: string): Promise<void> {
    const from = this.#configService.get<string>("EMAIL_FROM")!;
    const html = renderMagicLinkEmail({ link });

    try {
      await this.#resendProvider.getClient().emails.send({
        from,
        to: [email],
        subject: "Sign in to GameNight Hub",
        html,
      });

      this.#logger.log(`Magic link sent to ${email}`);
    } catch (err) {
      this.#logger.error(`Failed to send magic link to ${email}: ${err}`);
      throw new InternalServerErrorException({
        code: ERROR_CODE.MAGIC_LINK_FAILED,
        message: "Failed to send magic link email",
      });
    }
  }
}
