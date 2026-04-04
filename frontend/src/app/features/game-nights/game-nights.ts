import { httpResource } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { formatDateMedium } from '@core/utils/date-format';
import { CategoryFilterBar } from '@game-nights/components/category-filter-bar/category-filter-bar';
import { EventCard } from '@game-nights/components/event-card/event-card';
import { GameNightsMap } from '@game-nights/components/map/map';
import { MapPreviewCard } from '@game-nights/components/map-preview-card/map-preview-card';
import { TimeFilterBar } from '@game-nights/components/time-filter-bar/time-filter-bar';
import type { EventWithParticipants } from '@game-nights/models/event-with-participants';
import type { Location } from '@game-nights/models/location.model';
import { LocationsService } from '@game-nights/services/locations';
import {
	computeDateRange,
	type FilterPresetKey,
	resolvePreset,
} from '@game-nights/utils/date-range';
import {
	EVENT_CATEGORIES,
	type EventCategory,
	type PaginatedResponse,
	UI,
} from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

type PaginatedLocations = PaginatedResponse<Location>;
type PaginatedEvents = PaginatedResponse<EventWithParticipants>;

@Component({
	selector: 'app-game-nights',
	imports: [
		CategoryFilterBar,
		EventCard,
		GameNightsMap,
		MapPreviewCard,
		TimeFilterBar,
		TranslocoDirective,
	],
	templateUrl: './game-nights.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameNights {
	readonly #authService = inject(AuthService);
	readonly #toast = inject(ToastService);
	readonly #transloco = inject(TranslocoService);
	readonly #locationsService = inject(LocationsService);
	readonly #router = inject(Router);
	readonly #route = inject(ActivatedRoute);
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly #queryParams = toSignal(this.#route.queryParamMap);

	readonly activePreset = computed(
		() => resolvePreset(this.#queryParams()?.get('preset')) as FilterPresetKey,
	);

	readonly activeCategory = computed<EventCategory | 'all'>(() => {
		const raw = this.#queryParams()?.get('category');
		if (raw && (EVENT_CATEGORIES as readonly string[]).includes(raw)) {
			return raw as EventCategory;
		}
		return 'all';
	});

	readonly #dateRange = computed(() => computeDateRange(this.activePreset()));

	readonly #mapReloadTrigger = signal(0);
	readonly mapReloadTrigger = this.#mapReloadTrigger.asReadonly();

	readonly locationsResource = httpResource<PaginatedLocations>(() => `${this.#apiUrl}/locations`);

	readonly eventsResource = httpResource<PaginatedEvents>(() => {
		const range = this.#dateRange();
		const category = this.activeCategory();
		const params = new URLSearchParams();
		if (range.from) params.set('from', range.from);
		if (range.to) params.set('to', range.to);
		if (category !== 'all') params.set('category', category);
		const qs = params.toString();
		return `${this.#apiUrl}/events${qs ? `?${qs}` : ''}`;
	});

	readonly locations = computed(() => this.locationsResource.value()?.data ?? []);
	readonly events = computed(() => this.eventsResource.value()?.data ?? []);
	readonly loading = computed(
		() => this.locationsResource.isLoading() || this.eventsResource.isLoading(),
	);
	readonly error = computed(
		() => this.locationsResource.error()?.message ?? this.eventsResource.error()?.message ?? null,
	);

	readonly locationNameById = computed(() => {
		const map = new Map<string, string>();
		for (const loc of this.locations()) {
			map.set(loc.id, loc.name);
		}
		return map;
	});

	readonly locationPostalCodeById = computed(() => {
		const map = new Map<string, string>();
		for (const loc of this.locations()) {
			if (loc.postalCode) map.set(loc.id, loc.postalCode);
		}
		return map;
	});

	readonly activeLocationIds = computed(() => {
		if (this.activePreset() === 'all') return undefined;
		return new Set(this.events().map((e) => e.locationId));
	});

	readonly showMap = signal(this.#readShowMapPref());
	readonly isLoggedIn = this.#authService.isLoggedIn;

	readonly mapRef = viewChild<GameNightsMap>('gameMap');

	readonly selectedEventId = signal<string | null>(null);

	readonly selectedEvent = computed(() => {
		const id = this.selectedEventId();
		if (!id) return null;
		return this.events().find((e) => e.id === id) ?? null;
	});

	onMarkerClick(eventId: string): void {
		this.selectedEventId.set(eventId);
	}

	onClosePreview(): void {
		this.selectedEventId.set(null);
	}

	toggleMap(): void {
		this.showMap.update((v) => !v);
		setTimeout(() => this.mapRef()?.invalidateSize(), UI.MAP_INVALIDATE_DELAY_MS);
	}

	#readShowMapPref(): boolean {
		try {
			const stored = localStorage.getItem('gameNights_showMap');
			return stored === null ? true : stored !== 'false';
		} catch {
			return true;
		}
	}

	onDeleteLocation(locationId: string): void {
		this.#locationsService.deleteLocation(locationId).subscribe({
			next: () => {
				this.#mapReloadTrigger.update((n) => n + 1);
				this.locationsResource.reload();
				this.eventsResource.reload();
				this.#toast.success(this.#transloco.translate('game-nights.toast.locationDeleted'));
			},
			error: () => {
				this.#toast.error(this.#transloco.translate('game-nights.toast.locationDeleteFailed'));
			},
		});
	}

	formatDate(dateStr: string | Date): string {
		return formatDateMedium(dateStr, this.#transloco.getActiveLang());
	}

	navigateToCreateEvent(): void {
		void this.#router.navigate(['/create-event']);
	}

	onPresetChange(preset: FilterPresetKey): void {
		this.#router.navigate([], {
			queryParams: { preset },
			queryParamsHandling: 'merge',
		});
	}

	onCategoryChange(category: EventCategory | 'all'): void {
		this.#router.navigate([], {
			queryParams: { category: category === 'all' ? null : category },
			queryParamsHandling: 'merge',
		});
	}
}
