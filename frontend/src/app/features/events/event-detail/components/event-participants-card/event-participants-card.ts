import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Participant } from '@core/services/participants';
import { UI } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-event-participants-card',
	imports: [NgOptimizedImage, TranslocoDirective],
	templateUrl: './event-participants-card.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventParticipantsCard {
	readonly participants = input<Participant[]>([]);
	readonly maxPlayers = input<number | undefined>();
	readonly hostUsername = input('');
	readonly hostAvatar = input<string | null>(null);
	readonly isOwner = input(false);

	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$, {
		initialValue: '',
	});

	readonly PARTICIPANTS_PREVIEW_LIMIT = UI.PARTICIPANTS_PREVIEW_LIMIT;

	readonly hostInitial = computed(() => this.hostUsername()[0]?.toUpperCase() ?? '?');

	readonly participantCount = computed(() => this.participants().length);

	readonly isFull = computed(() => {
		const max = this.maxPlayers();
		if (!max) return false;
		return this.participantCount() >= max;
	});

	readonly spotsLeft = computed(() => {
		const max = this.maxPlayers();
		if (!max) return null;
		return Math.max(0, max - this.participantCount());
	});

	readonly urgencyText = computed(() => {
		this.#lang();
		const spots = this.spotsLeft();
		if (spots === null)
			return this.#transloco.translate('events.urgency.joined', {
				count: this.participantCount(),
			});
		if (spots === 0) return this.#transloco.translate('events.urgency.full');
		return spots === 1
			? this.#transloco.translate('events.urgency.spotsLeftSingular', {
					count: spots,
				})
			: this.#transloco.translate('events.urgency.spotsLeftPlural', {
					count: spots,
				});
	});

	readonly capacityPercent = computed(() => {
		const max = this.maxPlayers();
		if (!max) return 0;
		return Math.min(100, Math.round((this.participantCount() / max) * 100));
	});
}
