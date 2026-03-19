import { httpResource } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoDirective, translateSignal } from "@jsverse/transloco";
import { CalendarGrid } from "@calendar/components/calendar-grid/calendar-grid";
import { CalendarHeader } from "@calendar/components/calendar-header/calendar-header";
import { EventDetailsStrip } from "@calendar/components/event-details-strip/event-details-strip";
import {
	buildEventsByDateMap,
	generateMonthGrid,
	getEventsForDay,
	getUpcomingEvents,
	isSameDay,
} from "@calendar/utils/calendar-dates";
import { API_CONFIG } from "@core/config/api.config";
import type { CalendarEvent, PaginatedResponse } from "@gamenight-hub/shared";

@Component({
	selector: "app-calendar",
	imports: [
		CalendarGrid,
		CalendarHeader,
		EventDetailsStrip,
		TranslocoDirective,
	],
	templateUrl: "./calendar.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
	readonly #router = inject(Router);
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly currentYear = signal(new Date().getFullYear());
	readonly currentMonth = signal(new Date().getMonth());
	readonly selectedDay = signal<Date | null>(null);

	readonly #monthDateRange = computed(() => {
		const year = this.currentYear();
		const month = this.currentMonth();
		const from = new Date(year, month, 1);
		const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
		return {
			from: from.toISOString(),
			to: to.toISOString(),
		};
	});

	readonly eventsResource = httpResource<PaginatedResponse<CalendarEvent>>(
		() => {
			const range = this.#monthDateRange();
			const params = new URLSearchParams();
			params.set("from", range.from);
			params.set("to", range.to);
			return `${this.#apiUrl}/events?${params.toString()}`;
		},
	);

	readonly #monthEvents = computed(
		() => this.eventsResource.value()?.data ?? [],
	);

	readonly loading = computed(() => this.eventsResource.isLoading());
	readonly error = computed(() => this.eventsResource.error());

	readonly #m0 = translateSignal("months.0", {}, { scope: "calendar" });
	readonly #m1 = translateSignal("months.1", {}, { scope: "calendar" });
	readonly #m2 = translateSignal("months.2", {}, { scope: "calendar" });
	readonly #m3 = translateSignal("months.3", {}, { scope: "calendar" });
	readonly #m4 = translateSignal("months.4", {}, { scope: "calendar" });
	readonly #m5 = translateSignal("months.5", {}, { scope: "calendar" });
	readonly #m6 = translateSignal("months.6", {}, { scope: "calendar" });
	readonly #m7 = translateSignal("months.7", {}, { scope: "calendar" });
	readonly #m8 = translateSignal("months.8", {}, { scope: "calendar" });
	readonly #m9 = translateSignal("months.9", {}, { scope: "calendar" });
	readonly #m10 = translateSignal("months.10", {}, { scope: "calendar" });
	readonly #m11 = translateSignal("months.11", {}, { scope: "calendar" });

	readonly #monthNames = computed(() => [
		this.#m0(),
		this.#m1(),
		this.#m2(),
		this.#m3(),
		this.#m4(),
		this.#m5(),
		this.#m6(),
		this.#m7(),
		this.#m8(),
		this.#m9(),
		this.#m10(),
		this.#m11(),
	]);

	readonly monthYear = computed(
		() => `${this.#monthNames()[this.currentMonth()]} ${this.currentYear()}`,
	);

	readonly days = computed(() =>
		generateMonthGrid(this.currentYear(), this.currentMonth()),
	);

	readonly eventsByDate = computed(() =>
		buildEventsByDateMap(this.#monthEvents()),
	);

	readonly eventCount = computed(() => this.#monthEvents().length);

	readonly detailEvents = computed(() => {
		const day = this.selectedDay();
		if (day) return getEventsForDay(this.#monthEvents(), day);
		return getUpcomingEvents(this.#monthEvents());
	});

	onPrevMonth(): void {
		const month = this.currentMonth();
		if (month === 0) {
			this.currentYear.update((y) => y - 1);
			this.currentMonth.set(11);
		} else {
			this.currentMonth.update((m) => m - 1);
		}
		this.selectedDay.set(null);
	}

	onNextMonth(): void {
		const month = this.currentMonth();
		if (month === 11) {
			this.currentYear.update((y) => y + 1);
			this.currentMonth.set(0);
		} else {
			this.currentMonth.update((m) => m + 1);
		}
		this.selectedDay.set(null);
	}

	onToday(): void {
		const now = new Date();
		this.currentYear.set(now.getFullYear());
		this.currentMonth.set(now.getMonth());
		this.selectedDay.set(null);
	}

	onDayClick(date: Date): void {
		const current = this.selectedDay();
		if (current && isSameDay(current, date)) {
			this.selectedDay.set(null);
		} else {
			this.selectedDay.set(date);
		}
	}

	onEventClick(event: CalendarEvent): void {
		void this.#router.navigate(["/events", event.id]);
	}

	onNewEvent(): void {
		void this.#router.navigate(["/create-event"]);
	}

	onDetailCardClick(eventId: string): void {
		void this.#router.navigate(["/events", eventId]);
	}
}
