import { NgOptimizedImage } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
	signal,
} from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import { TranslocoDirective } from "@jsverse/transloco";
import type { PaginatedResponse } from "@gamenight-hub/shared";
import { ConfirmDialog } from "@shared/components/confirm-dialog/confirm-dialog";
import type { Game } from "@collection/models/game.model";
import { CollectionHeader } from "@collection/components/collection-header/collection-header";
import { CollectionToolbar } from "@collection/components/collection-toolbar/collection-toolbar";
import { GameCard } from "@collection/components/game-card/game-card";
import { AddToLibraryCta } from "@collection/components/add-to-library-cta/add-to-library-cta";
import {
	PLAYER_COUNT_FILTER,
	SORT_MODE,
	VIEW_MODE,
	STATUS_COLORS,
	STATUS_LABELS,
	type PlayerCountFilter,
	type SortMode,
	type ViewMode,
} from "@collection/models/collection.types";

type PaginatedGames = PaginatedResponse<Game>;

const VIEW_MODE_STORAGE_KEY = "collection-view-mode";
const PAGE_SIZE = 12;

function readViewMode(): ViewMode {
	try {
		const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
		if (stored === VIEW_MODE.GRID || stored === VIEW_MODE.LIST) {
			return stored;
		}
	} catch {
		/* noop */
	}
	return VIEW_MODE.GRID;
}

@Component({
	selector: "app-game-list",
	host: { class: "block" },
	imports: [
		NgOptimizedImage,
		TranslocoDirective,
		ConfirmDialog,
		CollectionHeader,
		CollectionToolbar,
		GameCard,
		AddToLibraryCta,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./game-list.html",
})
export class GameList {
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly isLoggedIn = input(false);
	readonly importGame = output<void>();
	readonly gameClick = output<string>();
	readonly gameDeleted = output<string>();

	readonly gamesResource = httpResource<PaginatedGames>(
		() => `${this.#apiUrl}${API_CONFIG.endpoints.games}`,
	);

	readonly games = computed(() => this.gamesResource.value()?.data ?? []);
	readonly loading = computed(() => this.gamesResource.isLoading());
	readonly totalGames = computed(() => this.games().length);

	readonly #playerFilter = signal<PlayerCountFilter>(PLAYER_COUNT_FILTER.ANY);
	readonly #categoryFilter = signal<string>("all");
	readonly #sortMode = signal<SortMode>(SORT_MODE.NAME_ASC);
	readonly #searchQuery = signal("");
	readonly #viewMode = signal<ViewMode>(readViewMode());
	readonly #displayedCount = signal(PAGE_SIZE);

	readonly playerFilter = this.#playerFilter.asReadonly();
	readonly categoryFilter = this.#categoryFilter.asReadonly();
	readonly sortMode = this.#sortMode.asReadonly();
	readonly searchQuery = this.#searchQuery.asReadonly();
	readonly viewMode = this.#viewMode.asReadonly();

	readonly availableCategories = computed(() => {
		const catSet = new Set<string>();
		for (const g of this.games()) {
			if (g.categories) {
				for (const c of g.categories) catSet.add(c);
			}
		}
		return [...catSet].sort();
	});

	readonly filteredGames = computed(() => {
		let result = this.games();

		const pf = this.#playerFilter();
		if (pf !== PLAYER_COUNT_FILTER.ANY) {
			const count = pf === "6+" ? 6 : Number(pf);
			result = result.filter((g) => {
				const min = g.minPlayers ?? 1;
				const max = g.maxPlayers ?? 99;
				return pf === "6+" ? max >= 6 : count >= min && count <= max;
			});
		}

		const cf = this.#categoryFilter();
		if (cf !== "all") {
			result = result.filter((g) => g.categories?.includes(cf));
		}

		const query = this.#searchQuery().toLowerCase().trim();
		if (query) {
			result = result.filter((g) => g.name.toLowerCase().includes(query));
		}

		const sort = this.#sortMode();
		result = [...result];
		switch (sort) {
			case SORT_MODE.NAME_ASC:
				result.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case SORT_MODE.NAME_DESC:
				result.sort((a, b) => b.name.localeCompare(a.name));
				break;
			case SORT_MODE.NEWEST:
				result.sort((a, b) => {
					const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					return dB - dA;
				});
				break;
			case SORT_MODE.OLDEST:
				result.sort((a, b) => {
					const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					return dA - dB;
				});
				break;
		}

		return result;
	});

	readonly displayedGames = computed(() =>
		this.filteredGames().slice(0, this.#displayedCount()),
	);

	readonly hasMore = computed(
		() => this.filteredGames().length > this.#displayedCount(),
	);

	readonly hasActiveFilters = computed(
		() =>
			this.#playerFilter() !== PLAYER_COUNT_FILTER.ANY ||
			this.#categoryFilter() !== "all" ||
			this.#sortMode() !== SORT_MODE.NAME_ASC ||
			this.#searchQuery().trim().length > 0,
	);

	readonly statusColors = STATUS_COLORS;
	readonly statusLabels = STATUS_LABELS;
	readonly gridMode = VIEW_MODE.GRID;

	readonly #confirmDialogOpen = signal(false);
	readonly #gameToDelete = signal<string | null>(null);

	readonly confirmDialogOpen = this.#confirmDialogOpen.asReadonly();
	readonly gameToDelete = this.#gameToDelete.asReadonly();

	onImportGame(): void {
		this.importGame.emit();
	}

	onGameClick(gameId: string): void {
		this.gameClick.emit(gameId);
	}

	onPlayerFilterChange(pf: PlayerCountFilter): void {
		this.#playerFilter.set(pf);
		this.#displayedCount.set(PAGE_SIZE);
	}

	onCategoryFilterChange(cat: string): void {
		this.#categoryFilter.set(cat);
		this.#displayedCount.set(PAGE_SIZE);
	}

	onSortChange(sort: SortMode): void {
		this.#sortMode.set(sort);
		this.#displayedCount.set(PAGE_SIZE);
	}

	onSearchChange(query: string): void {
		this.#searchQuery.set(query);
		this.#displayedCount.set(PAGE_SIZE);
	}

	onViewModeChange(mode: ViewMode): void {
		this.#viewMode.set(mode);
		try {
			localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
		} catch {
			/* noop */
		}
	}

	onLoadMore(): void {
		this.#displayedCount.update((count) => count + PAGE_SIZE);
	}

	onDeleteGame(gameId: string): void {
		this.#gameToDelete.set(gameId);
		this.#confirmDialogOpen.set(true);
	}

	onDeleteConfirmed(): void {
		const gameId = this.#gameToDelete();
		if (!gameId) return;
		this.#confirmDialogOpen.set(false);
		this.#gameToDelete.set(null);
		this.gameDeleted.emit(gameId);
	}

	onDeleteCancelled(): void {
		this.#confirmDialogOpen.set(false);
		this.#gameToDelete.set(null);
	}
}
