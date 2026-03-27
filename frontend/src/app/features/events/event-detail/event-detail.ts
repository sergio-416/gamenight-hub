import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { type Participant, ParticipantsService } from '@core/services/participants';
import { ToastService } from '@core/services/toast';
import type { Event as CalendarEvent, UpdateCalendarEvent } from '@features/calendar/models/event.model';
import { UpdateCalendarEventSchema } from '@features/calendar/models/event.model';
import { EventsService } from '@features/calendar/services/events';
import { CoverImagePicker } from '@features/create-event/components/cover-image-picker';
import type { Location } from '@gamenight-hub/shared';
import { CATEGORY_META, type EventCoverSlug, GAME_CONSTRAINTS, getEventCoverPath, UI } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SimpleMapPreview } from '@shared/components/simple-map-preview/simple-map-preview';
import { XpService } from '@shared/services/xp.service';
import { map } from 'rxjs';

type EventDetail = CalendarEvent & { isOwner?: boolean };

interface InfoPill {
	label: string;
	value: string;
	icon: string;
}

@Component({
	selector: 'app-event-detail',
	imports: [RouterLink, CoverImagePicker, SimpleMapPreview, NgOptimizedImage, TranslocoDirective],
	templateUrl: './event-detail.html',
	host: { class: 'block min-h-screen bg-slate-50' },
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetail {
	readonly PARTICIPANTS_PREVIEW_LIMIT = UI.PARTICIPANTS_PREVIEW_LIMIT;
	readonly #route = inject(ActivatedRoute);
	readonly #router = inject(Router);
	readonly #auth = inject(AuthService);
	readonly #eventsService = inject(EventsService);
	readonly #participantsService = inject(ParticipantsService);
	readonly #toast = inject(ToastService);
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$, { initialValue: '' });
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly #id = toSignal(this.#route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
		initialValue: '',
	});

	readonly eventResource = httpResource<EventDetail>(() =>
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
	readonly participantCount = computed(() => this.participants().length);

	readonly isJoined = computed(() => {
		const uid = this.#auth.currentUser()?.uid;
		if (!uid) return false;
		return this.participants().some((p) => p.userId === uid);
	});

	readonly isFull = computed(() => {
		const ev = this.event();
		if (!ev?.maxPlayers) return false;
		return this.participantCount() >= ev.maxPlayers;
	});

	readonly heroImage = computed(() => {
		const ev = this.event();
		if (!ev) return null;
		const coverPath = ev.coverImage ? getEventCoverPath(ev.coverImage as EventCoverSlug) : null;
		return coverPath ?? ev.gameImageUrl ?? ev.gameThumbnailUrl;
	});

	readonly hostUsername = computed(() => this.event()?.hostUsername ?? 'Unknown Host');

	readonly hostAvatar = computed(() => this.event()?.hostAvatar ?? null);

	readonly hostInitial = computed(() => this.hostUsername()[0]?.toUpperCase() ?? '?');

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

	readonly spotsLeft = computed(() => {
		const ev = this.event();
		if (!ev?.maxPlayers) return null;
		return Math.max(0, ev.maxPlayers - this.participantCount());
	});

	readonly urgencyText = computed(() => {
		this.#lang();
		const spots = this.spotsLeft();
		if (spots === null)
			return this.#transloco.translate('events.urgency.joined', {
				count: this.participantCount(),
			});
		if (spots === 0) return this.#transloco.translate('events.urgency.full');
		return spots === 1
			? this.#transloco.translate('events.urgency.spotsLeftSingular', {
					count: spots,
				})
			: this.#transloco.translate('events.urgency.spotsLeftPlural', {
					count: spots,
				});
	});

	readonly capacityPercent = computed(() => {
		const ev = this.event();
		if (!ev?.maxPlayers) return 0;
		return Math.min(100, Math.round((this.participantCount() / ev.maxPlayers) * 100));
	});

	readonly #joining = signal(false);
	readonly joining = this.#joining.asReadonly();

	readonly #leaving = signal(false);
	readonly leaving = this.#leaving.asReadonly();

	readonly #isEditing = signal(false);
	readonly isEditing = this.#isEditing.asReadonly();

	readonly #editForm = signal<UpdateCalendarEvent>({});
	readonly editForm = this.#editForm.asReadonly();

	readonly #saving = signal(false);
	readonly saving = this.#saving.asReadonly();

	readonly #saveError = signal<string | null>(null);
	readonly saveError = this.#saveError.asReadonly();

	readonly #showEndTime = signal(false);
	readonly showEndTime = this.#showEndTime.asReadonly();

	readonly #coverPickerOpen = signal(false);
	readonly coverPickerOpen = this.#coverPickerOpen.asReadonly();

	readonly editCoverPreview = computed(() => {
		const slug = this.#editForm().coverImage;
		return slug ? getEventCoverPath(slug as EventCoverSlug) : null;
	});

	readonly isEditValid = computed(() => {
		const form = this.#editForm();
		return (
			!!form.title?.trim() && !!form.maxPlayers && form.maxPlayers >= GAME_CONSTRAINTS.MIN_PLAYERS_EVENT && form.maxPlayers <= GAME_CONSTRAINTS.MAX_PLAYERS_LIMIT
		);
	});

	readonly editPlayerWarning = computed(() => {
		this.#lang();
		const ev = this.event();
		const current = this.#editForm().maxPlayers;
		if (!ev || !current) return null;
		if (ev.gameMaxPlayers && current > ev.gameMaxPlayers) {
			return this.#transloco.translate('events.editWarning.tooManyPlayers', {
				max: ev.gameMaxPlayers,
				current,
			});
		}
		if (ev.gameMinPlayers && current < ev.gameMinPlayers) {
			return this.#transloco.translate('events.editWarning.tooFewPlayers', {
				min: ev.gameMinPlayers,
				current,
			});
		}
		return null;
	});

	readonly startTimeLocal = computed(() => this.#toDatetimeLocal(this.#editForm().startTime));

	readonly endTimeLocal = computed(() => this.#toDatetimeLocal(this.#editForm().endTime));

	readonly #confirmingDelete = signal(false);
	readonly confirmingDelete = this.#confirmingDelete.asReadonly();

	readonly #deleting = signal(false);
	readonly deleting = this.#deleting.asReadonly();

	readonly #deleteError = signal<string | null>(null);
	readonly deleteError = this.#deleteError.asReadonly();

	readonly #startDateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

	readonly #timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	});

	formatStartTime(dateStr: string | Date): string {
		const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
		return `${this.#startDateFormatter.format(d)} · ${this.#timeFormatter.format(d)}`;
	}

	formatTime(dateStr: string | Date): string {
		return this.#timeFormatter.format(dateStr instanceof Date ? dateStr : new Date(dateStr));
	}

	startEditing(): void {
		const event = this.event();
		if (!event) return;
		this.#editForm.set({
			title: event.title,
			description: event.description ?? undefined,
			maxPlayers: event.maxPlayers,
			coverImage: event.coverImage ?? undefined,
			startTime:
				event.startTime instanceof Date
					? event.startTime.toISOString()
					: (event.startTime as unknown as string),
			endTime: event.endTime
				? event.endTime instanceof Date
					? event.endTime.toISOString()
					: (event.endTime as unknown as string)
				: undefined,
		});
		this.#showEndTime.set(!!event.endTime);
		this.#saveError.set(null);
		this.#isEditing.set(true);
	}

	cancelEditing(): void {
		this.#isEditing.set(false);
		this.#saveError.set(null);
	}

	updateField<K extends keyof UpdateCalendarEvent>(field: K, value: UpdateCalendarEvent[K]): void {
		this.#editForm.update((f) => ({ ...f, [field]: value }));
	}

	toggleEndTime(): void {
		this.#showEndTime.update((v) => !v);
		if (!this.#showEndTime()) {
			this.#editForm.update((f) => ({ ...f, endTime: undefined }));
		}
	}

	onTitleInput(e: globalThis.Event): void {
		this.updateField('title', (e.target as HTMLInputElement).value);
	}

	onDescriptionInput(e: globalThis.Event): void {
		this.updateField('description', (e.target as HTMLTextAreaElement).value);
	}

	onMaxPlayersInput(e: globalThis.Event): void {
		this.updateField('maxPlayers', +(e.target as HTMLInputElement).value);
	}

	onStartTimeInput(e: globalThis.Event): void {
		const raw = (e.target as HTMLInputElement).value;
		if (raw) this.updateField('startTime', this.#toDate(raw));
	}

	onEndTimeInput(e: globalThis.Event): void {
		const raw = (e.target as HTMLInputElement).value;
		this.updateField('endTime', raw ? this.#toDate(raw) : undefined);
	}

	openCoverPicker(): void {
		this.#coverPickerOpen.set(true);
	}

	closeCoverPicker(): void {
		this.#coverPickerOpen.set(false);
	}

	onCoverSelected(slug: EventCoverSlug): void {
		this.updateField('coverImage', slug);
		this.#coverPickerOpen.set(false);
	}

	preventE(e: KeyboardEvent): void {
		if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
	}

	save(): void {
		const event = this.event();
		if (!event || !this.isEditValid() || this.#saving()) return;

		const form = this.#editForm();
		const raw = {
			...form,
			startTime: this.#toISOString(form.startTime),
			endTime: this.#toISOString(form.endTime),
		};
		const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));

		const result = UpdateCalendarEventSchema.safeParse(payload);
		if (!result.success) {
			this.#saveError.set(
				result.error.issues[0]?.message ?? this.#transloco.translate('events.toast.invalidInput'),
			);
			return;
		}

		this.#saving.set(true);
		this.#saveError.set(null);

		this.#eventsService.updateEvent(event.id, result.data).subscribe({
			next: () => {
				this.#saving.set(false);
				this.#isEditing.set(false);
				this.eventResource.reload();
				this.#toast.success(this.#transloco.translate('events.toast.eventUpdated'));
			},
			error: () => {
				this.#saving.set(false);
				this.#saveError.set(this.#transloco.translate('events.toast.eventUpdateFailed'));
			},
		});
	}

	startDelete(): void {
		this.#confirmingDelete.set(true);
		this.#deleteError.set(null);
	}

	cancelDelete(): void {
		this.#confirmingDelete.set(false);
	}

	executeDelete(): void {
		const event = this.event();
		if (!event || this.#deleting()) return;

		this.#deleting.set(true);
		this.#deleteError.set(null);

		this.#eventsService.deleteEvent(event.id).subscribe({
			next: () => {
				this.#toast.success(this.#transloco.translate('events.toast.eventDeleted'));
				this.#router.navigate(['/game-nights']);
			},
			error: (err: { status?: number }) => {
				this.#deleting.set(false);
				if (err?.status === 403) {
					this.#deleteError.set(this.#transloco.translate('events.toast.eventDeleteForbidden'));
				} else {
					this.#deleteError.set(this.#transloco.translate('events.toast.eventDeleteFailed'));
				}
			},
		});
	}

	joinEvent(): void {
		const ev = this.event();
		if (!ev || this.#joining() || this.isFull() || this.isJoined()) return;

		this.#joining.set(true);
		this.#participantsService.joinEvent(ev.id).subscribe({
			next: () => {
				this.#joining.set(false);
				this.participantsResource.reload();
				this.#toast.success(this.#transloco.translate('events.toast.joinedEvent'));
				this.#xpService.refreshProfile();
			},
			error: () => {
				this.#joining.set(false);
				this.#toast.error(this.#transloco.translate('events.toast.joinFailed'));
			},
		});
	}

	leaveEvent(): void {
		if (this.isOwner()) {
			this.#toast.error(this.#transloco.translate('events.toast.hostCannotLeave'));
			return;
		}
		const ev = this.event();
		if (!ev || this.#leaving() || !this.isJoined()) return;

		this.#leaving.set(true);
		this.#participantsService.leaveEvent(ev.id).subscribe({
			next: () => {
				this.#leaving.set(false);
				this.participantsResource.reload();
				this.#toast.success(this.#transloco.translate('events.toast.leftEvent'));
			},
			error: () => {
				this.#leaving.set(false);
				this.#toast.error(this.#transloco.translate('events.toast.leaveFailed'));
			},
		});
	}

	#toISOString(value: string | undefined): string | undefined {
		if (!value) return undefined;
		return value;
	}

	#toDate(datetimeLocalValue: string): string {
		const date = new Date(datetimeLocalValue);
		const offsetMinutes = date.getTimezoneOffset();
		const sign = offsetMinutes <= 0 ? '+' : '-';
		const absMinutes = Math.abs(offsetMinutes);
		const hh = String(Math.floor(absMinutes / 60)).padStart(2, '0');
		const mm = String(absMinutes % 60).padStart(2, '0');
		return `${datetimeLocalValue}:00${sign}${hh}:${mm}`;
	}

	#toDatetimeLocal(value: string | Date | undefined): string {
		if (!value) return '';
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}
}
