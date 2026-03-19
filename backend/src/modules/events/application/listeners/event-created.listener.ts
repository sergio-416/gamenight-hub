import type { EventCreatedEvent } from "@events/domain/events/event-created.event";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { ParticipantsService } from "../../../participants/application/participants.service.js";

@Injectable()
export class EventCreatedListener {
  readonly #logger = new Logger(EventCreatedListener.name);
  readonly #participantsService: ParticipantsService;

  constructor(
    @Inject(ParticipantsService)
    participantsService: ParticipantsService
  ) {
    this.#participantsService = participantsService;
  }

  @OnEvent("event.created")
  async handleEventCreated(event: EventCreatedEvent): Promise<void> {
    try {
      await this.#participantsService.join(event.eventId, event.createdBy);
    } catch (err) {
      this.#logger.error(
        `Failed to auto-join creator ${event.createdBy} to event ${event.eventId}`,
        err
      );
    }
  }
}
