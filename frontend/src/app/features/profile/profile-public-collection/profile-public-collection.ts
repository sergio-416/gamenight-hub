import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import {
	PAGINATION,
	type PublicProfile,
	type PublicProfileGamesResponse,
} from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';

const TAB = {
	ALL: 'all',
	OWNED: 'owned',
	WANT_TO_PLAY: 'want_to_play',
	WANT_TO_TRY: 'want_to_try',
} as const;

type Tab = (typeof TAB)[keyof typeof TAB];

const STATUS_COLORS: Record<string, string> = {
	owned: 'bg-emerald-100 text-emerald-700',
	want_to_play: 'bg-blue-100 text-blue-700',
	want_to_try: 'bg-amber-100 text-amber-700',
	played: 'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
	owned: 'Owned',
	want_to_play: 'Want to Play',
	want_to_try: 'Want to Try',
	played: 'Played',
};

type PublicGame = PublicProfileGamesResponse['data'][number];

@Component({
	selector: 'app-profile-public-collection',
	imports: [NgOptimizedImage, RouterLink, TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	templateUrl: './profile-public-collection.html',
})
export class ProfilePublicCollection {
	readonly #route = inject(ActivatedRoute);
	readonly #base = API_CONFIG.baseUrl;
	readonly username = this.#route.snapshot.params['username'] as string;

	readonly #profileResource = httpResource<PublicProfile>(
		() => `${this.#base}/profile/${this.username}`,
	);
	readonly profile = computed(() =>
		this.#profileResource.hasValue() ? this.#profileResource.value() : undefined,
	);
	readonly profileLoading = computed(() => this.#profileResource.isLoading());
	readonly profileError = computed(() => !!this.#profileResource.error());

	readonly #gamesResource = httpResource<PublicProfileGamesResponse>(
		() => `${this.#base}/profile/${this.username}/games?limit=${PAGINATION.PUBLIC_COLLECTION_MAX}`,
	);
	readonly #allGames = computed<PublicGame[]>(() =>
		this.#gamesResource.hasValue() ? (this.#gamesResource.value()?.data ?? []) : [],
	);
	readonly gamesLoading = computed(() => this.#gamesResource.isLoading());

	readonly collectionHidden = computed(() => {
		const p = this.profile();
		return p && !p.showGameCollection;
	});

	readonly activeTab = signal<Tab>(TAB.ALL);
	readonly searchQuery = signal('');

	readonly ownedGames = computed(() => this.#allGames().filter((g) => g.status === 'owned'));
	readonly wantToPlayGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_play'),
	);
	readonly wantToTryGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_try'),
	);

	readonly totalGames = computed(() => this.#allGames().length);
	readonly ownedCount = computed(() => this.ownedGames().length);
	readonly wantToPlayCount = computed(() => this.wantToPlayGames().length);
	readonly wantToTryCount = computed(() => this.wantToTryGames().length);

	readonly filteredByTab = computed(() => {
		const tab = this.activeTab();
		switch (tab) {
			case TAB.OWNED:
				return this.ownedGames();
			case TAB.WANT_TO_PLAY:
				return this.wantToPlayGames();
			case TAB.WANT_TO_TRY:
				return this.wantToTryGames();
			default:
				return this.#allGames();
		}
	});

	readonly filteredGames = computed(() => {
		const query = this.searchQuery().toLowerCase().trim();
		const games = this.filteredByTab();
		if (!query) return games;
		return games.filter((g) => g.name.toLowerCase().includes(query));
	});

	readonly statusColors = STATUS_COLORS;
	readonly statusLabels = STATUS_LABELS;

	readonly tabs: Array<{ key: Tab; label: string; count: () => number }> = [
		{ key: TAB.ALL, label: 'All', count: () => this.totalGames() },
		{ key: TAB.OWNED, label: 'Owned', count: () => this.ownedCount() },
		{
			key: TAB.WANT_TO_PLAY,
			label: 'Want to Play',
			count: () => this.wantToPlayCount(),
		},
		{
			key: TAB.WANT_TO_TRY,
			label: 'Want to Try',
			count: () => this.wantToTryCount(),
		},
	];

	onTabChange(tab: Tab): void {
		this.activeTab.set(tab);
	}

	onSearchChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.searchQuery.set(input.value);
	}

	clearSearch(): void {
		this.searchQuery.set('');
	}
}
