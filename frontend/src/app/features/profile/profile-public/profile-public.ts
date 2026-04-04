import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { formatFullDate, formatMonthYear } from '@core/utils/date-format';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
	faBullseye,
	faCakeCandles,
	faCalendarDays,
	faDiceD6,
	faEnvelope,
	faFire,
	faLocationDot,
	faMedal,
	faMobileScreen,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import type {
	PublicProfile,
	PublicProfileGamesResponse,
	PublicXpResponse,
} from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LEVEL_TIERS } from '@shared/models/xp.model';
import { getTierColors } from '@shared/utils/tier-colors';

@Component({
	selector: 'app-profile-public',
	imports: [FontAwesomeModule, NgOptimizedImage, RouterLink, TranslocoDirective],
	templateUrl: './profile-public.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePublic {
	readonly #route = inject(ActivatedRoute);
	readonly #transloco = inject(TranslocoService);
	readonly #base = API_CONFIG.baseUrl;
	readonly #username = this.#route.snapshot.params['username'] as string;

	readonly #profileResource = httpResource<PublicProfile>(
		() => `${this.#base}/profile/${this.#username}`,
	);
	readonly profile = computed(() =>
		this.#profileResource.hasValue() ? this.#profileResource.value() : undefined,
	);
	readonly loading = computed(() => this.#profileResource.isLoading());
	readonly notFound = computed(() => !!this.#profileResource.error());

	readonly #gamesResource = httpResource<PublicProfileGamesResponse>(
		() => `${this.#base}/profile/${this.#username}/games`,
	);
	readonly #allGames = computed(() =>
		this.#gamesResource.hasValue() ? (this.#gamesResource.value()?.data ?? []) : [],
	);
	readonly gamesLoading = computed(() => this.#gamesResource.isLoading());

	readonly #xpResource = httpResource<PublicXpResponse>(
		() => `${this.#base}/profile/${this.#username}/xp`,
	);
	readonly xpProfile = computed(() =>
		this.#xpResource.hasValue() ? this.#xpResource.value() : undefined,
	);
	readonly xpLoading = computed(() => this.#xpResource.isLoading());

	readonly ownedGames = computed(() => this.#allGames().filter((g) => g.status === 'owned'));
	readonly recentGames = computed(() => this.ownedGames().slice(0, 8));
	readonly wantToPlayGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_play'),
	);
	readonly wantToTryGames = computed(() =>
		this.#allGames().filter((g) => g.status === 'want_to_try'),
	);

	readonly ownedCount = computed(() => this.ownedGames().length);
	readonly wantToPlayCount = computed(() => this.wantToPlayGames().length);
	readonly wantToTryCount = computed(() => this.wantToTryGames().length);

	readonly tierLabel = computed(() => LEVEL_TIERS[this.xpProfile()?.level ?? 1] ?? 'Novice');

	readonly tierColors = computed(() => getTierColors(this.xpProfile()?.level ?? 1));

	readonly memberSince = computed(() => {
		const p = this.profile();
		if (!p?.createdAt) return '';
		return formatMonthYear(new Date(p.createdAt), this.#transloco.getActiveLang());
	});

	readonly iconLocation = faLocationDot;
	readonly iconEnvelope = faEnvelope;
	readonly iconPhone = faMobileScreen;
	readonly iconBirthday = faCakeCandles;
	readonly iconCalendar = faCalendarDays;
	readonly iconDice = faDiceD6;
	readonly iconBullseye = faBullseye;
	readonly iconWand = faWandMagicSparkles;
	readonly iconMedal = faMedal;
	readonly iconFire = faFire;

	formatBirthday(birthday: string): string {
		return formatFullDate(new Date(birthday), this.#transloco.getActiveLang());
	}
}
