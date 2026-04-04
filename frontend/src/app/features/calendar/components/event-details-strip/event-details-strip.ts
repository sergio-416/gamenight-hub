import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { EventDetailCard } from '@calendar/components/event-detail-card/event-detail-card';
import { isSameDay } from '@calendar/utils/calendar-dates';
import { formatDayMonth } from '@core/utils/date-format';
import type { CalendarEvent } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
	selector: 'app-event-details-strip',
	host: { class: 'block' },
	imports: [EventDetailCard, TranslocoDirective],
	templateUrl: './event-details-strip.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailsStrip {
	readonly #transloco = inject(TranslocoService);

	readonly events = input.required<CalendarEvent[]>();
	readonly selectedDay = input<Date | null>(null);

	readonly eventClick = output<string>();

	readonly sectionLabel = computed(() => {
		const day = this.selectedDay();
		if (!day) return this.#transloco.translate('calendar.details.upcoming');
		const formatted = formatDayMonth(day, this.#transloco.getActiveLang());
		return this.#transloco.translate('calendar.details.eventsOn', { date: formatted });
	});

	readonly hasEvents = computed(() => this.events().length > 0);

	isEventToday(event: CalendarEvent): boolean {
		const date = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
		return isSameDay(date, new Date());
	}

	onEventClick(eventId: string): void {
		this.eventClick.emit(eventId);
	}
}
