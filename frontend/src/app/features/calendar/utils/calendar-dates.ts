import type { CalendarDay } from "@calendar/models/calendar-day.model";
import type { CalendarEvent } from "@gamenight-hub/shared";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

export const WEEKDAY_HEADERS = [
	"SUN",
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT",
] as const;

export const WEEKDAY_HEADERS_SHORT = [
	"S",
	"M",
	"T",
	"W",
	"T",
	"F",
	"S",
] as const;

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function isToday(d: Date): boolean {
	return isSameDay(d, new Date());
}

export function getMonthName(month: number): string {
	return MONTH_NAMES[month];
}

export function formatMonthYear(year: number, month: number): string {
	return `${MONTH_NAMES[month]} ${year}`;
}

export function generateMonthGrid(year: number, month: number): CalendarDay[] {
	const today = new Date();
	const first = new Date(year, month, 1);
	const start = new Date(first);
	start.setDate(1 - first.getDay());

	return Array.from({ length: 42 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return {
			date: d,
			dayOfMonth: d.getDate(),
			isCurrentMonth: d.getMonth() === month,
			isToday: isSameDay(d, today),
		};
	});
}

function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function getEventsForDay(
	events: CalendarEvent[],
	date: Date,
): CalendarEvent[] {
	return events.filter((e) => {
		const eventDate =
			e.startTime instanceof Date ? e.startTime : new Date(e.startTime);
		return isSameDay(eventDate, date);
	});
}

export function getUpcomingEvents(
	events: CalendarEvent[],
	referenceDate?: Date,
): CalendarEvent[] {
	const ref = new Date(referenceDate ?? new Date());
	ref.setHours(0, 0, 0, 0);

	return events
		.filter((e) => {
			const eventDate =
				e.startTime instanceof Date ? e.startTime : new Date(e.startTime);
			return eventDate >= ref;
		})
		.sort((a, b) => {
			const dateA =
				a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
			const dateB =
				b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
			return dateA.getTime() - dateB.getTime();
		});
}

export function buildEventsByDateMap(
	events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
	const map = new Map<string, CalendarEvent[]>();
	for (const event of events) {
		const eventDate =
			event.startTime instanceof Date
				? event.startTime
				: new Date(event.startTime);
		const key = toDateKey(eventDate);
		const existing = map.get(key);
		if (existing) {
			existing.push(event);
		} else {
			map.set(key, [event]);
		}
	}
	return map;
}

export function dateToKey(date: Date): string {
	return toDateKey(date);
}
