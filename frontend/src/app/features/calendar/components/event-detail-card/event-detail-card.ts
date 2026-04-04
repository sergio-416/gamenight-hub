import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CATEGORY_BORDER_CLASSES, CATEGORY_DATE_CLASSES } from '@calendar/utils/category-colours';
import { formatShortDayTime, formatTimeShort } from '@core/utils/date-format';
import type { CalendarEvent, EventCategory } from '@gamenight-hub/shared';
import { TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-event-detail-card',
	host: { class: 'block' },
	imports: [],
	templateUrl: './event-detail-card.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailCard {
	readonly #transloco = inject(TranslocoService);

	readonly event = input.required<CalendarEvent>();
	readonly isToday = input(false);

	readonly cardClick = output<string>();

	readonly containerClass = computed(() => {
		const cat = this.event().category as EventCategory | undefined;
		const border = cat
			? (CATEGORY_BORDER_CLASSES[cat] ?? 'border-l-border-strong')
			: 'border-l-border-strong';
		return `min-w-64 cursor-pointer rounded-lg border-l-4 bg-slate-50 p-4 shadow-sm transition-shadow hover:shadow-md ${border}`;
	});

	readonly dateLabel = computed(() => {
		const ev = this.event();
		const date = ev.startTime instanceof Date ? ev.startTime : new Date(ev.startTime);
		const lang = this.#transloco.getActiveLang();

		if (this.isToday()) {
			const time = formatTimeShort(date, lang);
			return `${this.#transloco.translate('calendar.details.todayLabel')} \u2022 ${time}`;
		}

		return formatShortDayTime(date, lang).toUpperCase();
	});

	readonly dateLabelClass = computed(() => {
		const base = 'text-xs font-semibold uppercase tracking-wide';
		if (this.isToday()) return `${base} text-emerald-600`;
		const cat = this.event().category as EventCategory | undefined;
		const color = cat
			? (CATEGORY_DATE_CLASSES[cat] ?? 'text-on-surface-dim')
			: 'text-on-surface-dim';
		return `${base} ${color}`;
	});

	readonly metaLine = computed(() => {
		const ev = this.event();
		const parts: string[] = [];

		if (ev.hostUsername) {
			parts.push(
				this.#transloco.translate('calendar.details.hostedBy', {
					username: ev.hostUsername,
				}),
			);
		}

		if (ev.maxPlayers) {
			parts.push(
				this.#transloco.translate('calendar.details.playersMax', {
					count: ev.maxPlayers,
				}),
			);
		}

		return parts.join(' \u2022 ') || null;
	});

	onCardClick(): void {
		this.cardClick.emit(this.event().id);
	}
}
