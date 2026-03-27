import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import { type Game, type PaginatedResponse, UI } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchInput } from '@shared/components/search-input/search-input';

interface GameSelection {
	id: string;
	name: string;
	thumbnailUrl?: string;
	categories?: string[];
	minPlayers?: number;
	maxPlayers?: number;
}

@Component({
	selector: 'app-game-picker',
	imports: [NgOptimizedImage, SearchInput, TranslocoDirective],
	templateUrl: './game-picker.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePicker {
	readonly CATEGORY_TAGS_LIMIT = UI.CATEGORY_TAGS_LIMIT;
	readonly selectedGameId = input<string | undefined>();

	readonly gameSelected = output<GameSelection>();
	readonly gameCleared = output<void>();

	readonly #searchText = signal('');
	readonly #showDropdown = signal(false);
	readonly #selectedGame = signal<GameSelection | undefined>(undefined);

	readonly searchText = this.#searchText.asReadonly();
	readonly showDropdown = this.#showDropdown.asReadonly();
	readonly selectedGame = this.#selectedGame.asReadonly();

	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly gamesResource = httpResource<PaginatedResponse<Game>>(
		() => `${this.#apiUrl}${API_CONFIG.endpoints.games}`,
	);

	readonly #allGames = computed(() => this.gamesResource.value()?.data ?? []);

	readonly filteredGames = computed(() => {
		const query = this.#searchText().toLowerCase().trim();
		const games = this.#allGames();
		if (!query) return games;
		return games.filter((g) => g.name.toLowerCase().includes(query));
	});

	readonly hasGames = computed(() => this.#allGames().length > 0);
	readonly isLoading = computed(() => this.gamesResource.isLoading());

	onSearchInput(value: string): void {
		this.#searchText.set(value);
		this.#showDropdown.set(true);
	}

	onSearchFocus(): void {
		this.#showDropdown.set(true);
	}

	onSearchBlur(): void {
		setTimeout(() => this.#showDropdown.set(false), 200);
	}

	selectGame(game: Game): void {
		const selection: GameSelection = {
			id: game.id,
			name: game.name,
			thumbnailUrl: game.thumbnailUrl ?? undefined,
			categories: game.categories ?? undefined,
			minPlayers: game.minPlayers ?? undefined,
			maxPlayers: game.maxPlayers ?? undefined,
		};
		this.#selectedGame.set(selection);
		this.#showDropdown.set(false);
		this.#searchText.set('');
		this.gameSelected.emit(selection);
	}

	clearSelection(): void {
		this.#selectedGame.set(undefined);
		this.#searchText.set('');
		this.gameCleared.emit();
	}

	formatPlayerCount(game: Game): string {
		if (game.minPlayers && game.maxPlayers) {
			return game.minPlayers === game.maxPlayers
				? `${game.minPlayers} players`
				: `${game.minPlayers}-${game.maxPlayers} players`;
		}
		if (game.minPlayers) return `${game.minPlayers}+ players`;
		if (game.maxPlayers) return `Up to ${game.maxPlayers} players`;
		return '';
	}
}
