import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { ProfileService } from '@core/services/profile.service';
import { ToastService } from '@core/services/toast';
import type { Game, GameSearchResult } from '@features/collection/models/game.model';
import { GamesService } from '@features/collection/services/games';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
	faBullseye,
	faCakeCandles,
	faCalendarDays,
	faCheck,
	faCheckSquare,
	faChessKnight,
	faDiceD6,
	faEnvelope,
	faFire,
	faGlobe,
	faLocationDot,
	faLock,
	faMagnifyingGlass,
	faMedal,
	faMobileScreen,
	faPen,
	faPlus,
	faShieldHalved,
	faSpinner,
	faSquare,
	faTrashCan,
	faWandMagicSparkles,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type {
	GameStatus,
	PaginatedResponse,
	Profile,
	UpdateProfileDto,
} from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DeleteAccountDialog } from '@shared/components/delete-account-dialog/delete-account-dialog';
import { XpHistory } from '@shared/components/xp-history/xp-history';
import { LEVEL_TIERS } from '@shared/models/xp.model';
import { XpService } from '@shared/services/xp.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

type PaginatedGames = PaginatedResponse<Game>;

@Component({
	selector: 'app-profile-me',
	imports: [
		CdkTrapFocus,
		FontAwesomeModule,
		NgOptimizedImage,
		RouterLink,
		TranslocoDirective,
		ConfirmDialog,
		DeleteAccountDialog,
		XpHistory,
	],
	templateUrl: './profile-me.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMe {
	readonly #profileService = inject(ProfileService);
	readonly #gamesService = inject(GamesService);
	readonly #authService = inject(AuthService);
	readonly #router = inject(Router);
	readonly #toastService = inject(ToastService);
	readonly #xpService = inject(XpService);
	readonly #base = API_CONFIG.baseUrl;

	readonly xpProfile = computed(() => this.#xpService.profile());
	readonly tierLabel = computed(() => LEVEL_TIERS[this.xpProfile()?.level ?? 1] ?? 'Novice');

	readonly tierColors = computed(() => {
		const level = this.xpProfile()?.level ?? 1;
		if (level >= 10)
			return {
				bg: 'bg-purple-500',
				ring: 'ring-purple-300',
				text: 'text-purple-600',
				bar: 'bg-purple-500',
				pill: 'bg-purple-100 text-purple-700',
			};
		if (level >= 7)
			return {
				bg: 'bg-amber-500',
				ring: 'ring-amber-300',
				text: 'text-amber-600',
				bar: 'bg-amber-500',
				pill: 'bg-amber-100 text-amber-700',
			};
		if (level >= 4)
			return {
				bg: 'bg-indigo-500',
				ring: 'ring-indigo-300',
				text: 'text-indigo-600',
				bar: 'bg-indigo-500',
				pill: 'bg-indigo-100 text-indigo-700',
			};
		return {
			bg: 'bg-emerald-500',
			ring: 'ring-emerald-300',
			text: 'text-emerald-600',
			bar: 'bg-emerald-500',
			pill: 'bg-emerald-100 text-emerald-700',
		};
	});

	readonly #profileResource = httpResource<Profile>(() => `${this.#base}/profile/me`);
	readonly #profileOverride = signal<Profile | null>(null);
	readonly profile = computed(
		() =>
			this.#profileOverride() ??
			(this.#profileResource.hasValue() ? this.#profileResource.value() : undefined),
	);
	readonly loading = computed(() => this.#profileResource.isLoading());
	readonly editing = signal(false);
	readonly saving = signal(false);
	readonly saveError = signal<string | null>(null);
	readonly editForm = signal<UpdateProfileDto>({});
	readonly showPrivateProfileModal = signal(false);
	readonly showDeleteAccountDialog = signal(false);

	readonly memberSince = computed(() => {
		const p = this.profile();
		if (!p?.createdAt) return '';
		return new Date(p.createdAt).toLocaleDateString('en-GB', {
			month: 'long',
			year: 'numeric',
		});
	});

	readonly nameCooldownDaysRemaining = computed(() => {
		const p = this.profile();
		if (!p?.nameChangedAt) return 0;
		const daysSince = (Date.now() - new Date(p.nameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
		return daysSince < 30 ? Math.ceil(30 - daysSince) : 0;
	});

	readonly nameFieldsLocked = computed(() => this.nameCooldownDaysRemaining() > 0);

	readonly nameUnlockDate = computed(() => {
		const p = this.profile();
		if (!p?.nameChangedAt) return '';
		const unlock = new Date(p.nameChangedAt);
		unlock.setDate(unlock.getDate() + 30);
		return unlock.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	});

	readonly #gamesResource = httpResource<PaginatedGames>(
		() => `${this.#base}${API_CONFIG.endpoints.games}`,
	);
	readonly #allGames = computed(() =>
		this.#gamesResource.hasValue() ? (this.#gamesResource.value()?.data ?? []) : [],
	);
	readonly gamesLoading = computed(() => this.#gamesResource.isLoading());

	readonly ownedGames = computed(() => this.#allGames().filter((g) => g.status === 'owned'));
	readonly ownedCount = computed(() => this.ownedGames().length);
	readonly recentGames = computed(() => this.ownedGames().slice(0, 8));
	readonly wantToPlayGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_play'),
	);
	readonly wantToPlayCount = computed(() => this.wantToPlayGames().length);
	readonly wantToTryGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_try'),
	);
	readonly wantToTryCount = computed(() => this.wantToTryGames().length);

	readonly showAddGameModal = signal(false);
	readonly addGameToStatus = signal<GameStatus>('want_to_play');

	readonly showRemoveConfirm = signal(false);
	readonly gameToRemove = signal<string | null>(null);

	readonly showMarkPlayedMode = signal(false);
	readonly selectedGamesForPlayed = signal<Set<string>>(new Set());
	readonly selectedPlayedCount = computed(() => this.selectedGamesForPlayed().size);
	readonly showMarkPlayedConfirm = signal(false);

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

	readonly searchQuery = signal('');
	readonly searchResults = computed(() =>
		(this.#searchResource.hasValue() ? (this.#searchResource.value() ?? []) : []).slice(0, 8),
	);
	readonly searchLoading = computed(() => this.#searchResource.isLoading());
	readonly importLoading = signal(false);

	readonly iconPen = faPen;
	readonly iconLocation = faLocationDot;
	readonly iconEnvelope = faEnvelope;
	readonly iconPhone = faMobileScreen;
	readonly iconBirthday = faCakeCandles;
	readonly iconPrivacy = faShieldHalved;
	readonly iconCalendar = faCalendarDays;
	readonly iconLock = faLock;
	readonly iconGlobe = faGlobe;
	readonly iconDice = faDiceD6;
	readonly iconBullseye = faBullseye;
	readonly iconWand = faWandMagicSparkles;
	readonly iconMedal = faMedal;
	readonly iconChess = faChessKnight;
	readonly iconPlus = faPlus;
	readonly iconTrash = faTrashCan;
	readonly iconX = faXmark;
	readonly iconSearch = faMagnifyingGlass;
	readonly iconSpinner = faSpinner;
	readonly iconCheck = faCheck;
	readonly iconSquare = faSquare;
	readonly iconCheckSquare = faCheckSquare;
	readonly iconFire = faFire;

	startEditing(): void {
		const p = this.profile();
		this.editForm.set({
			username: p?.username ?? undefined,
			bio: p?.bio ?? undefined,
			location: p?.location ?? undefined,
			firstName: p?.firstName ?? undefined,
			lastName: p?.lastName ?? undefined,
			mobilePhone: p?.mobilePhone ?? undefined,
			birthday: p?.birthday ?? undefined,
			backupEmail: p?.backupEmail ?? undefined,
			isProfilePublic: p?.isProfilePublic ?? false,
			useRealNameForContact: p?.useRealNameForContact ?? false,
			showFirstName: p?.showFirstName ?? false,
			showLastName: p?.showLastName ?? false,
			showLocation: p?.showLocation ?? false,
			showEmail: p?.showEmail ?? false,
			showMobilePhone: p?.showMobilePhone ?? false,
			showBirthday: p?.showBirthday ?? false,
			showBackupEmail: p?.showBackupEmail ?? false,
			showGameCollection: p?.showGameCollection ?? true,
		});
		this.editing.set(true);
	}

	save(): void {
		this.saving.set(true);
		this.saveError.set(null);

		const dto = { ...this.editForm() };
		if (this.nameFieldsLocked()) {
			delete dto.firstName;
			delete dto.lastName;
		}

		this.#profileService.updateMyProfile(dto).subscribe({
			next: (p) => {
				this.#profileOverride.set(p);
				this.editing.set(false);
				this.saving.set(false);
			},
			error: (err: unknown) => {
				this.saving.set(false);
				if (err instanceof HttpErrorResponse && err.status === 400) {
					const msg = err.error?.message;
					this.saveError.set(
						typeof msg === 'string' ? msg : 'Invalid data. Please check your inputs.',
					);
				} else if (err instanceof HttpErrorResponse && err.status === 409) {
					this.saveError.set('That username is already taken. Please choose another.');
				} else {
					this.saveError.set('Something went wrong. Please try again.');
				}
			},
		});
	}

	cancelEditing(): void {
		this.editing.set(false);
	}

	updateField(field: keyof UpdateProfileDto, value: string | boolean): void {
		this.editForm.update((f) => ({ ...f, [field]: value }));
	}

	onPublicProfileToggle(): void {
		const currentlyPublic = this.editForm().isProfilePublic;
		if (currentlyPublic) {
			this.showPrivateProfileModal.set(true);
		} else {
			this.updateField('isProfilePublic', true);
		}
	}

	confirmMakePrivate(): void {
		this.updateField('isProfilePublic', false);
		this.showPrivateProfileModal.set(false);
	}

	cancelMakePrivate(): void {
		this.showPrivateProfileModal.set(false);
	}

	formatBirthday(birthday: string): string {
		return new Date(birthday).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	openAddGameModal(status: GameStatus): void {
		this.addGameToStatus.set(status);
		this.showAddGameModal.set(true);
		this.searchQuery.set('');
		this.#searchInput$.next('');
	}

	closeAddGameModal(): void {
		this.showAddGameModal.set(false);
		this.searchQuery.set('');
		this.#searchInput$.next('');
	}

	onSearchInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.searchQuery.set(value);
		this.#searchInput$.next(value);
	}

	importGame(game: GameSearchResult): void {
		this.importLoading.set(true);
		const bggId = game.bggId;

		this.#gamesService.importGame(bggId, { status: this.addGameToStatus() }).subscribe({
			next: () => {
				this.importLoading.set(false);
				this.closeAddGameModal();
				this.#gamesResource.reload();
				this.#xpService.refreshProfile();
			},
			error: () => {
				this.importLoading.set(false);
			},
		});
	}

	removeWantToPlay(gameId: string): void {
		this.gameToRemove.set(gameId);
		this.showRemoveConfirm.set(true);
	}

	cancelRemoveWantToPlay(): void {
		this.showRemoveConfirm.set(false);
		this.gameToRemove.set(null);
	}

	removeWantToPlayConfirmed(): void {
		const gameId = this.gameToRemove();
		if (!gameId) return;

		this.#gamesService.deleteGame(gameId).subscribe(() => {
			this.cancelRemoveWantToPlay();
			this.#gamesResource.reload();
		});
	}

	toggleMarkPlayedMode(): void {
		this.showMarkPlayedMode.update((v) => !v);
		if (!this.showMarkPlayedMode()) {
			this.selectedGamesForPlayed.set(new Set());
		}
	}

	toggleGameSelection(gameId: string): void {
		this.selectedGamesForPlayed.update((set) => {
			const newSet = new Set(set);
			if (newSet.has(gameId)) {
				newSet.delete(gameId);
			} else {
				newSet.add(gameId);
			}
			return newSet;
		});
	}

	isGameSelected(gameId: string): boolean {
		return this.selectedGamesForPlayed().has(gameId);
	}

	confirmMarkAsPlayed(): void {
		if (this.selectedPlayedCount() === 0) return;
		this.showMarkPlayedConfirm.set(true);
	}

	cancelMarkAsPlayed(): void {
		this.showMarkPlayedConfirm.set(false);
	}

	markAsPlayedConfirmed(): void {
		const gameIds = Array.from(this.selectedGamesForPlayed());
		if (gameIds.length === 0) return;

		let remaining = gameIds.length;
		for (const gameId of gameIds) {
			this.#gamesService.markAsPlayed(gameId).subscribe({
				next: () => {
					remaining--;
					if (remaining === 0) this.#gamesResource.reload();
				},
				error: () => {
					remaining--;
					this.#toastService.error('Failed to mark game as played');
					if (remaining === 0) this.#gamesResource.reload();
				},
			});
		}

		this.selectedGamesForPlayed.set(new Set());
		this.showMarkPlayedConfirm.set(false);
		this.showMarkPlayedMode.set(false);
	}

	async logout(): Promise<void> {
		await this.#authService.logout();
		await this.#router.navigate(['/home']);
	}

	onAccountDeleted(): void {
		void this.#authService.logout().then(() => {
			void this.#router.navigate(['/home']);
		});
	}
}
