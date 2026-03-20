import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-calendar-header',
	host: { class: 'block' },
	imports: [TranslocoDirective],
	templateUrl: './calendar-header.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarHeader {
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$);

	readonly monthYear = input.required<string>();
	readonly eventCount = input.required<number>();

	readonly prev = output<void>();
	readonly next = output<void>();
	readonly today = output<void>();
	readonly newEvent = output<void>();

	readonly subtitle = computed(() => {
		this.#lang();
		const count = this.eventCount();
		if (count === 0) return this.#transloco.translate('calendar.header.noEvents');
		if (count === 1) return this.#transloco.translate('calendar.header.eventCount', { count });
		return this.#transloco.translate('calendar.header.eventCountPlural', {
			count,
		});
	});

	onPrev(): void {
		this.prev.emit();
	}

	onNext(): void {
		this.next.emit();
	}

	onToday(): void {
		this.today.emit();
	}

	onNewEvent(): void {
		this.newEvent.emit();
	}
}
