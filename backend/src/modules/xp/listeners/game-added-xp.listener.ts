import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { XpService } from '../application/xp.service.js';
import type { GameAddedEvent } from '../domain/xp-events.js';

@Injectable()
export class GameAddedXpListener {
	readonly #logger = new Logger(GameAddedXpListener.name);
	readonly #xpService: XpService;

	constructor(@Inject(XpService) xpService: XpService) {
		this.#xpService = xpService;
	}

	@OnEvent('game.added')
	async handle(event: GameAddedEvent): Promise<void> {
		try {
			await this.#xpService.awardXp(event.userId, 'game_added', {
				gameId: event.gameId,
				gameName: event.gameName,
			});
		} catch (err) {
			this.#logger.error(
				`Failed to award XP for game.added (user=${event.userId}, game=${event.gameId})`,
				err,
			);
		}
	}
}
