import { CdkTrapFocus } from '@angular/cdk/a11y';
import { httpResource } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_CONFIG } from '@core/config/api.config';
import type { GameSearchResult } from '@features/collection/models/game.model';
import { GamesService } from '@features/collection/services/games';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faPlus, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { GameStatus } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { XpService } from '@shared/services/xp.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
	selector: 'app-profile-game-search-modal',
	imports: [CdkTrapFocus, FontAwesomeModule, TranslocoDirective],
	templateUrl: './profile-game-search-modal.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileGameSearchModal {
	readonly isOpen = input(false);
	readonly status = input<GameStatus>('want_to_play');

	readonly closed = output<void>();
	readonly gameImported = output<void>();

	readonly #gamesService = inject(GamesService);
	readonly #xpService = inject(XpService);
	readonly #base = API_CONFIG.baseUrl;

	readonly searchQuery = signal('');
	readonly importLoading = signal(false);

	readonly #searchInput$ = new Subject<string>();
	readonly #debouncedSearch = toSignal(
		this.#searchInput$.pipe(debounceTime(300), distinctUntilChanged()),
		{ initialValue: '' },
	);
	readonly #searchResource = httpResource<GameSearchResult[]>(() => {
		const query = this.#debouncedSearch().trim();
		if (query.length < 2) return undefined;
		return `${this.#base}${API_CONFIG.endpoints.search}?query=${query}`;
	});

	readonly searchResults = computed(() =>
		(this.#searchResource.hasValue() ? (this.#searchResource.value() ?? []) : []).slice(0, 8),
	);
	readonly searchLoading = computed(() => this.#searchResource.isLoading());

	readonly iconSearch = faMagnifyingGlass;
	readonly iconPlus = faPlus;
	readonly iconSpinner = faSpinner;
	readonly iconX = faXmark;

	onSearchInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.searchQuery.set(value);
		this.#searchInput$.next(value);
	}

	importGame(game: GameSearchResult): void {
		this.importLoading.set(true);
		const bggId = game.bggId;

		this.#gamesService.importGame(bggId, { status: this.status() }).subscribe({
			next: () => {
				this.importLoading.set(false);
				this.#resetSearch();
				this.#xpService.refreshProfile();
				this.gameImported.emit();
			},
			error: () => {
				this.importLoading.set(false);
			},
		});
	}

	close(): void {
		this.#resetSearch();
		this.closed.emit();
	}

	#resetSearch(): void {
		this.searchQuery.set('');
		this.#searchInput$.next('');
	}
}
