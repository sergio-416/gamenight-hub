import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { CategoryBadge } from "@game-nights/components/category-badge/category-badge";
import type { EventWithParticipants } from "@game-nights/models/event-with-participants";

@Component({
	selector: "app-map-preview-card",
	host: { class: "block" },
	imports: [CategoryBadge, RouterLink, TranslocoDirective],
	templateUrl: "./map-preview-card.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPreviewCard {
	readonly event = input.required<EventWithParticipants>();
	readonly locationName = input<string>("Unknown location");
	readonly formatDate = input.required<(dateStr: string | Date) => string>();

	readonly close = output<void>();

	readonly formattedDate = computed(() =>
		this.formatDate()(this.event().startTime),
	);

	readonly isFull = computed(() => {
		const e = this.event();
		return (
			e.maxPlayers !== undefined &&
			e.participantCount !== undefined &&
			e.participantCount >= e.maxPlayers
		);
	});

	readonly capacityLabel = computed(() => {
		const e = this.event();
		if (!e.maxPlayers) return null;
		return `${e.participantCount ?? 0}/${e.maxPlayers} Joined`;
	});
}
