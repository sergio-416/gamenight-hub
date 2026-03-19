import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { XpService } from "../application/xp.service.js";
import type { ProfileCreatedEvent } from "../domain/xp-events.js";

@Injectable()
export class ProfileCreatedXpListener {
  readonly #logger = new Logger(ProfileCreatedXpListener.name);
  readonly #xpService: XpService;

  constructor(@Inject(XpService) xpService: XpService) {
    this.#xpService = xpService;
  }

  @OnEvent("profile.created")
  async handle(event: ProfileCreatedEvent): Promise<void> {
    try {
      await this.#xpService.createProfile(event.userId);
    } catch (err) {
      this.#logger.error(
        `Failed to create XP profile for user=${event.userId}`,
        err
      );
    }
  }
}
