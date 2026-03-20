import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { EventWithParticipants } from '@game-nights/models/event-with-participants';
import { CATEGORY_META, type EventCoverSlug, getEventCoverPath } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';

type DateFormatter = (dateStr: string | Date) => string;

@Component({
	selector: 'app-event-card',
	host: { class: 'block' },
	imports: [RouterLink, NgOptimizedImage, TranslocoDirective],
	templateUrl: './event-card.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCard {
	readonly event = input.required<EventWithParticipants>();
	readonly locationName = input<string>('Unknown location');
	readonly postalCode = input<string | undefined>(undefined);
	readonly formatDate = input.required<DateFormatter>();

	readonly categoryMeta = computed(() => {
		const cat = this.event().category;
		return cat ? CATEGORY_META[cat] : null;
	});

	readonly categoryTextClass = computed(() => {
		const meta = this.categoryMeta();
		if (!meta) return null;
		const match = meta.colorClass.match(/text-\S+/);
		return match ? match[0] : null;
	});

	readonly imageUrl = computed(() => {
		const ev = this.event();
		const coverPath = ev.coverImage ? getEventCoverPath(ev.coverImage as EventCoverSlug) : null;
		return coverPath ?? ev.gameImageUrl ?? ev.gameThumbnailUrl;
	});

	readonly isFull = computed(
		() =>
			this.event().maxPlayers != null &&
			(this.event().participantCount ?? 0) >= this.event().maxPlayers!,
	);
}
