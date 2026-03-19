import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from "@angular/core";
import {
	CATEGORY_BORDER_CLASSES,
	CATEGORY_DATE_CLASSES,
} from "@calendar/utils/category-colours";
import type { CalendarEvent, EventCategory } from "@gamenight-hub/shared";

@Component({
	selector: "app-event-detail-card",
	host: { class: "block" },
	imports: [],
	templateUrl: "./event-detail-card.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailCard {
	readonly event = input.required<CalendarEvent>();
	readonly isToday = input(false);

	readonly cardClick = output<string>();

	readonly containerClass = computed(() => {
		const cat = this.event().category as EventCategory | undefined;
		const border = cat
			? (CATEGORY_BORDER_CLASSES[cat] ?? "border-l-border-strong")
			: "border-l-border-strong";
		return `min-w-64 cursor-pointer rounded-lg border-l-4 bg-slate-50 p-4 shadow-sm transition-shadow hover:shadow-md ${border}`;
	});

	readonly dateLabel = computed(() => {
		const ev = this.event();
		const date =
			ev.startTime instanceof Date ? ev.startTime : new Date(ev.startTime);
		const time = new Intl.DateTimeFormat("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(date);

		if (this.isToday()) {
			return `TODAY \u2022 ${time}`;
		}

		const dayPart = new Intl.DateTimeFormat("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		}).format(date);

		return `${dayPart.toUpperCase()} \u2022 ${time}`;
	});

	readonly dateLabelClass = computed(() => {
		const base = "text-xs font-semibold uppercase tracking-wide";
		if (this.isToday()) return `${base} text-emerald-600`;
		const cat = this.event().category as EventCategory | undefined;
		const color = cat
			? (CATEGORY_DATE_CLASSES[cat] ?? "text-on-surface-dim")
			: "text-on-surface-dim";
		return `${base} ${color}`;
	});

	readonly metaLine = computed(() => {
		const ev = this.event();
		const parts: string[] = [];

		if (ev.hostUsername) {
			parts.push(`Hosted by ${ev.hostUsername}`);
		}

		if (ev.maxPlayers) {
			parts.push(`${ev.maxPlayers} players max`);
		}

		return parts.join(" \u2022 ") || null;
	});

	onCardClick(): void {
		this.cardClick.emit(this.event().id);
	}
}
