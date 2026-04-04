import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import type { Participant } from '@core/services/participants';
import { formatDateFull, formatTime as formatTimeUtil } from '@core/utils/date-format';
import type { Event as CalendarEvent } from '@features/calendar/models/event.model';
import type { Location } from '@gamenight-hub/shared';
import { CATEGORY_META, type EventCoverSlug, getEventCoverPath } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SimpleMapPreview } from '@shared/components/simple-map-preview/simple-map-preview';
import { map } from 'rxjs';
import { EventEditPanel } from './components/event-edit-panel/event-edit-panel';
import { EventJoinActions } from './components/event-join-actions/event-join-actions';
import { EventParticipantsCard } from './components/event-participants-card/event-participants-card';

type EventDetailData = CalendarEvent & { isOwner?: boolean };

interface InfoPill {
	label: string;
	value: string;
	icon: string;
}

@Component({
	selector: 'app-event-detail',
	imports: [
		RouterLink,
		SimpleMapPreview,
		NgOptimizedImage,
		TranslocoDirective,
		EventEditPanel,
		EventJoinActions,
		EventParticipantsCard,
	],
	templateUrl: './event-detail.html',
	host: { class: 'block min-h-screen bg-slate-50' },
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetail {
	readonly #route = inject(ActivatedRoute);
	readonly #auth = inject(AuthService);
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$, { initialValue: '' });
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly #id = toSignal(this.#route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
		initialValue: '',
	});

	readonly eventResource = httpResource<EventDetailData>(() =>
		this.#id() ? `${this.#apiUrl}/events/${this.#id()}` : undefined,
	);

	readonly locationResource = httpResource<Location>(() => {
		const event = this.eventResource.value();
		if (!event) return undefined;
		return `${this.#apiUrl}/locations/${event.locationId}`;
	});

	readonly event = computed(() => this.eventResource.value());
	readonly location = computed(() => this.locationResource.value());
	readonly loading = computed(() => this.eventResource.isLoading());

	readonly isOwner = computed(() => this.event()?.isOwner ?? false);

	readonly isLoggedIn = this.#auth.isLoggedIn;

	readonly participantsResource = httpResource<Participant[]>(() =>
		this.#id() ? `${this.#apiUrl}/events/${this.#id()}/participants` : undefined,
	);

	readonly participants = computed(() => this.participantsResource.value() ?? []);

	readonly isJoined = computed(() => {
		const uid = this.#auth.currentUser()?.uid;
		if (!uid) return false;
		return this.participants().some((p) => p.userId === uid);
	});

	readonly isFull = computed(() => {
		const ev = this.event();
		if (!ev?.maxPlayers) return false;
		return this.participants().length >= ev.maxPlayers;
	});

	readonly heroImage = computed(() => {
		const ev = this.event();
		if (!ev) return null;
		const coverPath = ev.coverImage ? getEventCoverPath(ev.coverImage as EventCoverSlug) : null;
		return coverPath ?? ev.gameImageUrl ?? ev.gameThumbnailUrl;
	});

	readonly hostUsername = computed(() => this.event()?.hostUsername ?? 'Unknown Host');

	readonly hostAvatar = computed(() => this.event()?.hostAvatar ?? null);

	readonly categoryMeta = computed(() => {
		const cat = this.event()?.category;
		return cat ? CATEGORY_META[cat] : null;
	});

	readonly infoPills = computed<InfoPill[]>(() => {
		this.#lang();
		const ev = this.event();
		if (!ev) return [];
		const pills: InfoPill[] = [];

		const meta = this.categoryMeta();
		if (meta) {
			pills.push({
				label: this.#transloco.translate('events.infoPill.category'),
				value: meta.label,
				icon: meta.iconName,
			});
		}

		if (ev.gameComplexity != null) {
			pills.push({
				label: this.#transloco.translate('events.infoPill.weight'),
				value: `${ev.gameComplexity.toFixed(1)} / 5`,
				icon: 'faWeight',
			});
		}

		if (ev.gamePlayingTime != null) {
			pills.push({
				label: this.#transloco.translate('events.infoPill.playingTime'),
				value: `${ev.gamePlayingTime} ${this.#transloco.translate('events.infoPill.minSuffix')}`,
				icon: 'faClock',
			});
		}

		if (ev.gameMinPlayers != null && ev.gameMaxPlayers != null) {
			pills.push({
				label: this.#transloco.translate('events.infoPill.players'),
				value: `${ev.gameMinPlayers} – ${ev.gameMaxPlayers}`,
				icon: 'faUsers',
			});
		}

		return pills;
	});

	formatStartTime(dateStr: string | Date): string {
		const lang = this.#transloco.getActiveLang();
		return `${formatDateFull(dateStr, lang)} \u00b7 ${formatTimeUtil(dateStr, lang)}`;
	}

	formatTime(dateStr: string | Date): string {
		return formatTimeUtil(dateStr, this.#transloco.getActiveLang());
	}

	onParticipantsChanged(): void {
		this.participantsResource.reload();
	}

	onEventSaved(): void {
		this.eventResource.reload();
	}
}
