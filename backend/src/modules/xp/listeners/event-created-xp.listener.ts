import type { EventCreatedEvent } from '@events/domain/events/event-created.event';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { XpService } from '../application/xp.service.js';

@Injectable()
export class EventCreatedXpListener {
	readonly #logger = new Logger(EventCreatedXpListener.name);
	readonly #xpService: XpService;

	constructor(@Inject(XpService) xpService: XpService) {
		this.#xpService = xpService;
	}

	@OnEvent('event.created')
	async handle(event: EventCreatedEvent): Promise<void> {
		try {
			await this.#xpService.awardXp(event.createdBy, 'event_created', {
				eventId: event.eventId,
			});
		} catch (err) {
			this.#logger.error(
				`Failed to award XP for event.created (user=${event.createdBy}, event=${event.eventId})`,
				err,
			);
		}
	}
}
