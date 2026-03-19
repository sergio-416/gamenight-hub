import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";
import type { CalendarEvent } from "@gamenight-hub/shared";
import { EventDetailCard } from "@calendar/components/event-detail-card/event-detail-card";
import { isSameDay } from "@calendar/utils/calendar-dates";

@Component({
	selector: "app-event-details-strip",
	host: { class: "block" },
	imports: [EventDetailCard, TranslocoDirective],
	templateUrl: "./event-details-strip.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailsStrip {
	readonly events = input.required<CalendarEvent[]>();
	readonly selectedDay = input<Date | null>(null);

	readonly eventClick = output<string>();

	readonly sectionLabel = computed(() => {
		const day = this.selectedDay();
		if (!day) return "Upcoming Events";

		const formatted = new Intl.DateTimeFormat("en-US", {
			month: "long",
			day: "numeric",
		}).format(day);

		return `Events on ${formatted}`;
	});

	readonly hasEvents = computed(() => this.events().length > 0);

	isEventToday(event: CalendarEvent): boolean {
		const date =
			event.startTime instanceof Date
				? event.startTime
				: new Date(event.startTime);
		return isSameDay(date, new Date());
	}

	onEventClick(eventId: string): void {
		this.eventClick.emit(eventId);
	}
}
