import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParticipantsService } from '@core/services/participants';
import { ToastService } from '@core/services/toast';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { XpService } from '@shared/services/xp.service';

@Component({
	selector: 'app-event-join-actions',
	imports: [RouterLink, TranslocoDirective],
	templateUrl: './event-join-actions.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventJoinActions {
	readonly isLoggedIn = input(false);
	readonly isOwner = input(false);
	readonly isJoined = input(false);
	readonly isFull = input(false);
	readonly eventId = input.required<string>();
	readonly fullWidth = input(false);

	readonly joined = output<void>();
	readonly left = output<void>();

	readonly #participantsService = inject(ParticipantsService);
	readonly #toast = inject(ToastService);
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);

	readonly #joining = signal(false);
	readonly joining = this.#joining.asReadonly();

	readonly #leaving = signal(false);
	readonly leaving = this.#leaving.asReadonly();

	joinEvent(): void {
		if (this.#joining() || this.isFull() || this.isJoined()) return;

		this.#joining.set(true);
		this.#participantsService.joinEvent(this.eventId()).subscribe({
			next: () => {
				this.#joining.set(false);
				this.joined.emit();
				this.#toast.success(this.#transloco.translate('events.toast.joinedEvent'));
				this.#xpService.refreshProfile();
			},
			error: () => {
				this.#joining.set(false);
				this.#toast.error(this.#transloco.translate('events.toast.joinFailed'));
			},
		});
	}

	leaveEvent(): void {
		if (this.isOwner()) {
			this.#toast.error(this.#transloco.translate('events.toast.hostCannotLeave'));
			return;
		}
		if (this.#leaving() || !this.isJoined()) return;

		this.#leaving.set(true);
		this.#participantsService.leaveEvent(this.eventId()).subscribe({
			next: () => {
				this.#leaving.set(false);
				this.left.emit();
				this.#toast.success(this.#transloco.translate('events.toast.leftEvent'));
			},
			error: () => {
				this.#leaving.set(false);
				this.#toast.error(this.#transloco.translate('events.toast.leaveFailed'));
			},
		});
	}
}
