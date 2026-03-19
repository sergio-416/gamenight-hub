import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	input,
	output,
	signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { httpResource } from "@angular/common/http";
import { API_CONFIG } from "@core/config/api.config";
import { Subject, debounceTime, distinctUntilChanged, map } from "rxjs";
import { TranslocoDirective } from "@jsverse/transloco";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { DateTimePicker } from "@shared/components/date-time-picker/date-time-picker";

export interface NominatimResult {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
	address?: { postcode?: string };
}

interface SelectedLocation {
	name: string;
	address?: string;
	postalCode?: string;
	latitude: number;
	longitude: number;
}

@Component({
	selector: "app-wizard-step-location",
	imports: [FaIconComponent, TranslocoDirective, DateTimePicker],
	templateUrl: "./wizard-step-location.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepLocation {
	readonly locationMode = input<"public" | "private">("private");
	readonly address = input<string>("");
	readonly selectedLocation = input<SelectedLocation | undefined>();
	readonly startDate = input<string>("");
	readonly startTime = input<string>("");
	readonly endDate = input<string | undefined>();
	readonly endTime = input<string | undefined>();
	readonly showEndTime = input<boolean>(false);

	readonly locationModeChange = output<"public" | "private">();
	readonly addressInput = output<string>();
	readonly locationSelected = output<SelectedLocation>();
	readonly startDateChange = output<string>();
	readonly startTimeChange = output<string>();
	readonly endDateChange = output<string>();
	readonly endTimeChange = output<string>();
	readonly showEndTimeChange = output<boolean>();

	readonly #addressInput$ = new Subject<string>();

	readonly #debouncedQuery = toSignal(
		this.#addressInput$.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			map((q) => q.trim()),
		),
		{ initialValue: "" },
	);

	readonly #geocodeResource = httpResource<NominatimResult[]>(() => {
		const query = this.#debouncedQuery();
		if (!query || query.length < 3) return undefined;
		return {
			url: `${API_CONFIG.baseUrl}/locations/geocode`,
			params: { q: query, limit: "5" },
		};
	});

	readonly #internalAddress = signal("");
	readonly #showSuggestions = signal(false);
	readonly #showEndTimeInternal = signal(false);

	readonly internalAddress = this.#internalAddress.asReadonly();
	readonly suggestions = computed(() => this.#geocodeResource.value() ?? []);
	readonly showSuggestions = this.#showSuggestions.asReadonly();
	readonly isSearching = this.#geocodeResource.isLoading;
	readonly showEndTimeInternal = this.#showEndTimeInternal.asReadonly();

	readonly iconSearch = faMagnifyingGlass;
	readonly today = new Date();

	readonly startDateTime = computed(() => {
		const d = this.startDate();
		const t = this.startTime();
		if (!d) return null;
		const [y, m, day] = d.split("-").map(Number);
		const [h, min] = t ? t.split(":").map(Number) : [12, 0];
		return new Date(y, m - 1, day, h, min);
	});

	readonly endDateTime = computed(() => {
		const d = this.endDate();
		const t = this.endTime();
		if (!d) return null;
		const [y, m, day] = d.split("-").map(Number);
		const [h, min] = t ? t.split(":").map(Number) : [12, 0];
		return new Date(y, m - 1, day, h, min);
	});

	readonly selectedLocationDisplay = computed(() => {
		const loc = this.selectedLocation();
		if (!loc) return "";
		return loc.address ?? loc.name;
	});

	readonly #syncSuggestions = effect(() => {
		const results = this.suggestions();
		this.#showSuggestions.set(results.length > 0);
	});

	onAddressInput(event: globalThis.Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.#internalAddress.set(value);
		this.addressInput.emit(value);
		this.#addressInput$.next(value);
	}

	onAddressFocus(): void {
		if (this.suggestions().length > 0) {
			this.#showSuggestions.set(true);
		}
	}

	onAddressBlur(): void {
		setTimeout(() => this.#showSuggestions.set(false), 200);
	}

	selectSuggestion(suggestion: NominatimResult): void {
		const autoName = suggestion.display_name.split(",")[0].trim();
		const location: SelectedLocation = {
			name: autoName,
			address: suggestion.display_name,
			postalCode: suggestion.address?.postcode,
			latitude: Number.parseFloat(suggestion.lat),
			longitude: Number.parseFloat(suggestion.lon),
		};
		this.#internalAddress.set(suggestion.display_name);
		this.#showSuggestions.set(false);
		this.locationSelected.emit(location);
	}

	toggleEndTime(): void {
		const next = !this.#showEndTimeInternal();
		this.#showEndTimeInternal.set(next);
		this.showEndTimeChange.emit(next);
	}

	onStartDateTimeChange(date: Date): void {
		this.startDateChange.emit(this.#formatDate(date));
		this.startTimeChange.emit(this.#formatTime(date));
	}

	onEndDateTimeChange(date: Date): void {
		this.endDateChange.emit(this.#formatDate(date));
		this.endTimeChange.emit(this.#formatTime(date));
	}

	#formatDate(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	}

	#formatTime(d: Date): string {
		return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
	}
}
