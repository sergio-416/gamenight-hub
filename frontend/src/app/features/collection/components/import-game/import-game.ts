import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { GameSearchResult } from '@collection/models/game.model';
import { GamesService } from '@collection/services/games';
import { ToastService } from '@core/services/toast';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchInput } from '@shared/components/search-input/search-input';
import { XpService } from '@shared/services/xp.service';

@Component({
	selector: 'app-import-game',
	imports: [RouterLink, SearchInput, TranslocoDirective],
	templateUrl: './import-game.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportGame {
	readonly #gamesService = inject(GamesService);
	readonly #route = inject(ActivatedRoute);
	readonly #router = inject(Router);
	readonly #toastService = inject(ToastService);
	readonly #xpService = inject(XpService);

	readonly #queryParams = toSignal(this.#route.queryParams, {
		initialValue: {} as Record<string, string>,
	});
	readonly #initialQ = computed(() => this.#queryParams()['q'] ?? '');

	readonly #searchQuery = signal('');
	readonly #searchResults = signal<GameSearchResult[]>([]);
	readonly #loading = signal(false);
	readonly #importingBggId = signal<number | null>(null);
	readonly #error = signal<string | null>(null);
	readonly #hasSearched = signal(false);

	readonly searchQuery = this.#searchQuery.asReadonly();
	readonly searchResults = this.#searchResults.asReadonly();
	readonly loading = this.#loading.asReadonly();
	readonly importingBggId = this.#importingBggId.asReadonly();
	readonly error = this.#error.asReadonly();
	readonly hasSearched = this.#hasSearched.asReadonly();

	constructor() {
		effect(() => {
			const q = this.#initialQ();
			if (q && !this.#hasSearched()) {
				this.#searchQuery.set(q);
				this.search();
			}
		});
	}

	isOwned(bggId: number): boolean {
		return this.#gamesService.ownedBggIds().has(bggId);
	}

	onSearchInput(value: string): void {
		this.#searchQuery.set(value);
	}

	goBack(): void {
		this.#router.navigate(['/collection']);
	}

	search(): void {
		if (!this.#searchQuery()) return;

		this.#loading.set(true);
		this.#error.set(null);
		this.#hasSearched.set(true);

		this.#router.navigate([], {
			queryParams: { q: this.#searchQuery() },
			queryParamsHandling: 'merge',
		});

		this.#gamesService.search(this.#searchQuery()).subscribe({
			next: (results) => {
				this.#searchResults.set(results);
				this.#loading.set(false);
			},
			error: () => {
				this.#error.set('Failed to search games. Please try again.');
				this.#loading.set(false);
			},
		});
	}

	importGame(bggId: number): void {
		this.#importingBggId.set(bggId);
		this.#error.set(null);

		this.#gamesService.importGame(bggId, { status: 'owned' }).subscribe({
			next: () => {
				this.#toastService.success('Game imported successfully!');
				this.#gamesService.reloadOwnedBggIds();
				this.#importingBggId.set(null);
				this.#xpService.refreshProfile();
			},
			error: () => {
				this.#error.set('Failed to import game. Please try again.');
				this.#importingBggId.set(null);
			},
		});
	}
}
