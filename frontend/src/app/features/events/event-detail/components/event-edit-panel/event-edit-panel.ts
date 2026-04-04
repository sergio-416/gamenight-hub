import { NgOptimizedImage } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast';
import { appendTimezoneOffset } from '@core/utils/timezone';
import type {
	Event as CalendarEvent,
	UpdateCalendarEvent,
} from '@features/calendar/models/event.model';
import { UpdateCalendarEventSchema } from '@features/calendar/models/event.model';
import { EventsService } from '@features/calendar/services/events';
import { CoverImagePicker } from '@features/create-event/components/cover-image-picker';
import { type EventCoverSlug, GAME_CONSTRAINTS, getEventCoverPath } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

type EventDetailData = CalendarEvent & { isOwner?: boolean };

@Component({
	selector: 'app-event-edit-panel',
	imports: [NgOptimizedImage, CoverImagePicker, TranslocoDirective],
	templateUrl: './event-edit-panel.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventEditPanel {
	readonly event = input.required<EventDetailData>();

	readonly saved = output<void>();
	readonly cancelled = output<void>();
	readonly deleted = output<void>();

	readonly #router = inject(Router);
	readonly #eventsService = inject(EventsService);
	readonly #toast = inject(ToastService);
	readonly #transloco = inject(TranslocoService);

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

	readonly #confirmingDelete = signal(false);
	readonly confirmingDelete = this.#confirmingDelete.asReadonly();

	readonly #deleting = signal(false);
	readonly deleting = this.#deleting.asReadonly();

	readonly #deleteError = signal<string | null>(null);
	readonly deleteError = this.#deleteError.asReadonly();

	readonly editCoverPreview = computed(() => {
		const slug = this.#editForm().coverImage;
		return slug ? getEventCoverPath(slug as EventCoverSlug) : null;
	});

	readonly isEditValid = computed(() => {
		const form = this.#editForm();
		return (
			!!form.title?.trim() &&
			!!form.maxPlayers &&
			form.maxPlayers >= GAME_CONSTRAINTS.MIN_PLAYERS_EVENT &&
			form.maxPlayers <= GAME_CONSTRAINTS.MAX_PLAYERS_LIMIT
		);
	});

	readonly editPlayerWarning = computed(() => {
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

	startEditing(): void {
		const event = this.event();
		if (!event) return;
		this.#editForm.set({
			title: event.title,
			description: event.description ?? undefined,
			maxPlayers: event.maxPlayers,
			coverImage: event.coverImage ?? undefined,
			startTime:
				event.startTime instanceof Date ? event.startTime.toISOString() : String(event.startTime),
			endTime: event.endTime
				? event.endTime instanceof Date
					? event.endTime.toISOString()
					: String(event.endTime)
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
				this.saved.emit();
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
				this.deleted.emit();
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

	#toISOString(value: string | undefined): string | undefined {
		if (!value) return undefined;
		return value;
	}

	#toDate(datetimeLocalValue: string): string {
		return appendTimezoneOffset(datetimeLocalValue);
	}

	#toDatetimeLocal(value: string | Date | undefined): string {
		if (!value) return '';
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}
}
