import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast';
import { CreateCalendarEventSchema } from '@features/calendar/models/event.model';
import { EventsService } from '@features/calendar/services/events';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { XpService } from '@shared/services/xp.service';

import { WizardMapPanel } from './components/wizard-map-panel/wizard-map-panel';
import { WizardNavigation } from './components/wizard-navigation/wizard-navigation';
import { WizardStepGame } from './components/wizard-step-game/wizard-step-game';
import { WizardStepIndicator } from './components/wizard-step-indicator/wizard-step-indicator';
import { WizardStepLocation } from './components/wizard-step-location/wizard-step-location';
import { WizardStepPlayers } from './components/wizard-step-players/wizard-step-players';
import {
	INITIAL_WIZARD_STATE,
	type WizardFormData,
	type WizardState,
	type WizardStep,
} from './models/wizard-state';
import { StepGameSchema, StepLocationSchema, StepPlayersSchema } from './schemas/wizard-validation';

interface SelectedGame {
	id: string;
	thumbnailUrl?: string;
	minPlayers?: number;
	maxPlayers?: number;
}

@Component({
	selector: 'app-create-event',
	imports: [
		TranslocoDirective,
		WizardMapPanel,
		WizardNavigation,
		WizardStepGame,
		WizardStepIndicator,
		WizardStepLocation,
		WizardStepPlayers,
	],
	templateUrl: './create-event.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEvent {
	readonly #eventsService = inject(EventsService);
	readonly #router = inject(Router);
	readonly #toast = inject(ToastService);
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);

	readonly #state = signal<WizardState>(INITIAL_WIZARD_STATE);
	readonly #saved = signal(false);
	readonly #gamePlayerRange = signal<{ min?: number; max?: number }>({});
	readonly gameMinPlayers = computed(() => this.#gamePlayerRange().min);
	readonly gameMaxPlayers = computed(() => this.#gamePlayerRange().max);

	readonly currentStep = computed(() => this.#state().currentStep);
	readonly formData = computed(() => this.#state().formData);
	readonly isSubmitting = computed(() => this.#state().isSubmitting);

	readonly title = computed(() => this.formData().title ?? '');
	readonly description = computed(() => this.formData().description ?? '');
	readonly selectedGameId = computed(() => this.formData().gameId);
	readonly coverImage = computed(() => this.formData().coverImage);
	readonly category = computed(() => this.formData().category);
	readonly locationMode = computed(() => this.formData().locationMode ?? 'private');
	readonly startDate = computed(() => this.formData().startDate ?? '');
	readonly startTime = computed(() => this.formData().startTime ?? '');
	readonly endDate = computed(() => this.formData().endDate);
	readonly endTime = computed(() => this.formData().endTime);
	readonly maxPlayers = computed(() => this.formData().maxPlayers ?? 4);
	readonly selectedLocation = computed(() => this.formData().location);
	readonly mapLatitude = computed(() => this.formData().location?.latitude);
	readonly mapLongitude = computed(() => this.formData().location?.longitude);
	readonly mapLocationName = computed(() => this.formData().location?.name);

	readonly canContinue = computed(() => {
		const step = this.currentStep();
		const data = this.formData();
		if (step === 1) return StepGameSchema.safeParse(data).success;
		if (step === 2) {
			const locValid = StepLocationSchema.safeParse(data).success;
			return locValid && !!data.location;
		}
		if (step === 3) return StepPlayersSchema.safeParse(data).success;
		return false;
	});

	hasUnsavedChanges(): boolean {
		if (this.#saved()) return false;
		const data = this.formData();
		return !!data.title || !!data.description || !!data.location || !!data.gameId;
	}

	updateField<K extends keyof WizardFormData>(field: K, value: Partial<WizardFormData>[K]): void {
		this.#state.update((state) => ({
			...state,
			formData: { ...state.formData, [field]: value },
		}));
	}

	goNext(): void {
		this.#state.update((state) => ({
			...state,
			currentStep: Math.min(state.currentStep + 1, 3) as WizardStep,
		}));
	}

	goBack(): void {
		this.#state.update((state) => ({
			...state,
			currentStep: Math.max(state.currentStep - 1, 1) as WizardStep,
		}));
	}

	onGameSelected(game: SelectedGame): void {
		this.#state.update((state) => ({
			...state,
			formData: {
				...state.formData,
				gameId: game.id,
			},
		}));
		this.#gamePlayerRange.set({
			min: game.minPlayers,
			max: game.maxPlayers,
		});
	}

	onGameCleared(): void {
		this.#state.update((state) => ({
			...state,
			formData: {
				...state.formData,
				gameId: undefined,
			},
		}));
		this.#gamePlayerRange.set({});
	}

	onLocationSelected(location: NonNullable<Partial<WizardFormData>['location']>): void {
		this.#state.update((state) => ({
			...state,
			formData: {
				...state.formData,
				location,
			},
		}));
	}

	close(): void {
		this.#router.navigate(['/game-nights']);
	}

	handleSubmit(): void {
		if (!this.canContinue() || this.isSubmitting()) return;

		const data = this.formData();
		const payload = {
			title: data.title ?? '',
			startTime: this.#toISOWithOffset(data.startDate, data.startTime),
			endTime: this.#toISOWithOffset(data.endDate, data.endTime),
			description: data.description,
			maxPlayers: data.maxPlayers ?? 4,
			gameId: data.gameId,
			coverImage: data.coverImage,
			category: data.category,
			location: data.location,
		};

		const result = CreateCalendarEventSchema.safeParse(payload);
		if (!result.success) {
			this.#toast.error(
				result.error.issues[0]?.message ??
					this.#transloco.translate('create-event.toast.invalidEventData'),
			);
			return;
		}

		this.#state.update((state) => ({ ...state, isSubmitting: true }));

		this.#eventsService.createEvent(result.data).subscribe({
			next: (created) => {
				this.#saved.set(true);
				this.#state.update((state) => ({ ...state, isSubmitting: false }));
				this.#toast.success(this.#transloco.translate('create-event.toast.eventCreated'));
				this.#xpService.refreshProfile();
				this.#router.navigate(['/events', created.id]);
			},
			error: () => {
				this.#state.update((state) => ({ ...state, isSubmitting: false }));
				this.#toast.error(this.#transloco.translate('create-event.toast.eventFailed'));
			},
		});
	}

	#toISOWithOffset(date?: string, time?: string): string | undefined {
		if (!date || !time) return undefined;
		const local = new Date(`${date}T${time}`);
		const offsetMinutes = local.getTimezoneOffset();
		const sign = offsetMinutes <= 0 ? '+' : '-';
		const absMinutes = Math.abs(offsetMinutes);
		const hh = String(Math.floor(absMinutes / 60)).padStart(2, '0');
		const mm = String(absMinutes % 60).padStart(2, '0');
		return `${date}T${time}:00${sign}${hh}:${mm}`;
	}
}
