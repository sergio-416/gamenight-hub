import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EventPill } from '@calendar/components/event-pill/event-pill';
import type { CalendarDay } from '@calendar/models/calendar-day.model';
import { dateToKey } from '@calendar/utils/calendar-dates';
import { CATEGORY_DOT_CLASSES } from '@calendar/utils/category-colours';
import type { CalendarEvent, EventCategory } from '@gamenight-hub/shared';
import { TranslocoDirective, translateSignal } from '@jsverse/transloco';

const _WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

@Component({
	selector: 'app-calendar-grid',
	host: { class: 'block' },
	imports: [EventPill, TranslocoDirective],
	templateUrl: './calendar-grid.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGrid {
	readonly days = input.required<CalendarDay[]>();
	readonly eventsByDate = input.required<Map<string, CalendarEvent[]>>();
	readonly selectedDate = input<Date | null>(null);

	readonly dayClick = output<Date>();
	readonly eventClick = output<CalendarEvent>();

	readonly #sun = translateSignal('weekdays.sun', {}, { scope: 'calendar' });
	readonly #mon = translateSignal('weekdays.mon', {}, { scope: 'calendar' });
	readonly #tue = translateSignal('weekdays.tue', {}, { scope: 'calendar' });
	readonly #wed = translateSignal('weekdays.wed', {}, { scope: 'calendar' });
	readonly #thu = translateSignal('weekdays.thu', {}, { scope: 'calendar' });
	readonly #fri = translateSignal('weekdays.fri', {}, { scope: 'calendar' });
	readonly #sat = translateSignal('weekdays.sat', {}, { scope: 'calendar' });

	readonly #sunS = translateSignal('weekdaysShort.sun', {}, { scope: 'calendar' });
	readonly #monS = translateSignal('weekdaysShort.mon', {}, { scope: 'calendar' });
	readonly #tueS = translateSignal('weekdaysShort.tue', {}, { scope: 'calendar' });
	readonly #wedS = translateSignal('weekdaysShort.wed', {}, { scope: 'calendar' });
	readonly #thuS = translateSignal('weekdaysShort.thu', {}, { scope: 'calendar' });
	readonly #friS = translateSignal('weekdaysShort.fri', {}, { scope: 'calendar' });
	readonly #satS = translateSignal('weekdaysShort.sat', {}, { scope: 'calendar' });

	readonly weekdayHeaders = computed(() => [
		this.#sun(),
		this.#mon(),
		this.#tue(),
		this.#wed(),
		this.#thu(),
		this.#fri(),
		this.#sat(),
	]);

	readonly weekdayHeadersShort = computed(() => [
		this.#sunS(),
		this.#monS(),
		this.#tueS(),
		this.#wedS(),
		this.#thuS(),
		this.#friS(),
		this.#satS(),
	]);

	getEventsForCell(day: CalendarDay): CalendarEvent[] {
		return this.eventsByDate().get(dateToKey(day.date)) ?? [];
	}

	getVisibleEvents(day: CalendarDay): CalendarEvent[] {
		return this.getEventsForCell(day).slice(0, 3);
	}

	getOverflowCount(day: CalendarDay): number {
		const total = this.getEventsForCell(day).length;
		return total > 3 ? total - 3 : 0;
	}

	isSelected(day: CalendarDay): boolean {
		const selected = this.selectedDate();
		if (!selected) return false;
		return (
			day.date.getFullYear() === selected.getFullYear() &&
			day.date.getMonth() === selected.getMonth() &&
			day.date.getDate() === selected.getDate()
		);
	}

	getDotClass(event: CalendarEvent): string {
		const cat = event.category as EventCategory | undefined;
		if (!cat) return 'bg-slate-400';
		return CATEGORY_DOT_CLASSES[cat] ?? 'bg-slate-400';
	}

	onDayClick(day: CalendarDay): void {
		this.dayClick.emit(day.date);
	}

	onPillClick(event: CalendarEvent): void {
		this.eventClick.emit(event);
	}
}
