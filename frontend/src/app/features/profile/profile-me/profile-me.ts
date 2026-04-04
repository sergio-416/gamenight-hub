import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { formatFullDate, formatMonthYear } from '@core/utils/date-format';
import type { Game } from '@features/collection/models/game.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
	faCakeCandles,
	faCalendarDays,
	faEnvelope,
	faFire,
	faGlobe,
	faLocationDot,
	faLock,
	faMedal,
	faMobileScreen,
	faPen,
	faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import type { GameStatus, PaginatedResponse, Profile } from '@gamenight-hub/shared';
import { UI } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LEVEL_TIERS } from '@shared/models/xp.model';
import { XpService } from '@shared/services/xp.service';
import { getTierColors } from '@shared/utils/tier-colors';
import { ProfileEditForm } from './components/profile-edit-form/profile-edit-form';
import { ProfileGameLists } from './components/profile-game-lists/profile-game-lists';
import { ProfileGameSearchModal } from './components/profile-game-search-modal/profile-game-search-modal';

type PaginatedGames = PaginatedResponse<Game>;

@Component({
	selector: 'app-profile-me',
	imports: [
		FontAwesomeModule,
		NgOptimizedImage,
		TranslocoDirective,
		ProfileEditForm,
		ProfileGameLists,
		ProfileGameSearchModal,
	],
	templateUrl: './profile-me.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMe {
	readonly #authService = inject(AuthService);
	readonly #router = inject(Router);
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);
	readonly #base = API_CONFIG.baseUrl;

	readonly xpProfile = computed(() => this.#xpService.profile());
	readonly tierLabel = computed(() => LEVEL_TIERS[this.xpProfile()?.level ?? 1] ?? 'Novice');
	readonly tierColors = computed(() => getTierColors(this.xpProfile()?.level ?? 1));

	readonly #profileResource = httpResource<Profile>(() => `${this.#base}/profile/me`);
	readonly #profileOverride = signal<Profile | null>(null);
	readonly profile = computed(
		() =>
			this.#profileOverride() ??
			(this.#profileResource.hasValue() ? this.#profileResource.value() : undefined),
	);
	readonly loading = computed(() => this.#profileResource.isLoading());
	readonly editing = signal(false);

	readonly memberSince = computed(() => {
		const p = this.profile();
		if (!p?.createdAt) return '';
		return formatMonthYear(new Date(p.createdAt), this.#transloco.getActiveLang());
	});

	readonly nameCooldownDaysRemaining = computed(() => {
		const p = this.profile();
		if (!p?.nameChangedAt) return 0;
		const daysSince = (Date.now() - new Date(p.nameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
		return daysSince < UI.NAME_CHANGE_COOLDOWN_DAYS
			? Math.ceil(UI.NAME_CHANGE_COOLDOWN_DAYS - daysSince)
			: 0;
	});

	readonly nameFieldsLocked = computed(() => this.nameCooldownDaysRemaining() > 0);

	readonly nameUnlockDate = computed(() => {
		const p = this.profile();
		if (!p?.nameChangedAt) return '';
		const unlock = new Date(p.nameChangedAt);
		unlock.setDate(unlock.getDate() + UI.NAME_CHANGE_COOLDOWN_DAYS);
		return formatFullDate(unlock, this.#transloco.getActiveLang());
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

	readonly iconPen = faPen;
	readonly iconLocation = faLocationDot;
	readonly iconEnvelope = faEnvelope;
	readonly iconPhone = faMobileScreen;
	readonly iconBirthday = faCakeCandles;
	readonly iconPrivacy = faShieldHalved;
	readonly iconCalendar = faCalendarDays;
	readonly iconLock = faLock;
	readonly iconGlobe = faGlobe;
	readonly iconMedal = faMedal;
	readonly iconFire = faFire;

	startEditing(): void {
		this.editing.set(true);
	}

	onProfileSaved(profile: Profile): void {
		this.#profileOverride.set(profile);
		this.editing.set(false);
	}

	onEditCancelled(): void {
		this.editing.set(false);
	}

	openAddGameModal(status: GameStatus): void {
		this.addGameToStatus.set(status);
		this.showAddGameModal.set(true);
	}

	onGameImported(): void {
		this.showAddGameModal.set(false);
		this.#gamesResource.reload();
	}

	onAddGameModalClosed(): void {
		this.showAddGameModal.set(false);
	}

	onGamesChanged(): void {
		this.#gamesResource.reload();
	}

	formatBirthday(birthday: string): string {
		return formatFullDate(new Date(birthday), this.#transloco.getActiveLang());
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
