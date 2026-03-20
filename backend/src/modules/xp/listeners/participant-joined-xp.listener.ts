import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { XpService } from '../application/xp.service.js';
import type { ParticipantJoinedEvent } from '../domain/xp-events.js';

@Injectable()
export class ParticipantJoinedXpListener {
	readonly #logger = new Logger(ParticipantJoinedXpListener.name);
	readonly #xpService: XpService;

	constructor(@Inject(XpService) xpService: XpService) {
		this.#xpService = xpService;
	}

	@OnEvent('participant.joined')
	async handle(event: ParticipantJoinedEvent): Promise<void> {
		if (event.userId === event.hostId) return;

		try {
			await this.#xpService.awardXp(event.userId, 'participant_joined', {
				eventId: event.eventId,
			});
		} catch (err) {
			this.#logger.error(
				`Failed to award XP for participant.joined (user=${event.userId}, event=${event.eventId})`,
				err,
			);
		}
	}
}
