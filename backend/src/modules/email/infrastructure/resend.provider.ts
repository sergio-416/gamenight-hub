import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendProvider implements OnModuleInit {
  readonly #logger = new Logger(ResendProvider.name);
  readonly #configService: ConfigService;
  #client!: Resend;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.#configService = configService;
  }

  onModuleInit(): void {
    const apiKey = this.#configService.get<string>("RESEND_API_KEY");

    if (!apiKey) {
      this.#logger.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY missing");
    }

    this.#client = new Resend(apiKey);
    this.#logger.log("Resend client initialized");
  }

  getClient(): Resend {
    return this.#client;
  }
}
