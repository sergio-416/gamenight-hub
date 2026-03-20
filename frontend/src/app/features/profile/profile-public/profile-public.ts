import { NgOptimizedImage } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { API_CONFIG } from "@core/config/api.config";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
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
} from "@fortawesome/free-solid-svg-icons";
import type {
	PublicProfile,
	PublicProfileGamesResponse,
	PublicXpResponse,
} from "@gamenight-hub/shared";
import { TranslocoDirective } from "@jsverse/transloco";
import { LEVEL_TIERS } from "@shared/models/xp.model";

@Component({
	selector: "app-profile-public",
	imports: [
		FontAwesomeModule,
		NgOptimizedImage,
		RouterLink,
		TranslocoDirective,
	],
	templateUrl: "./profile-public.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePublic {
	readonly #route = inject(ActivatedRoute);
	readonly #base = API_CONFIG.baseUrl;
	readonly #username = this.#route.snapshot.params["username"] as string;

	readonly #profileResource = httpResource<PublicProfile>(
		() => `${this.#base}/profile/${this.#username}`,
	);
	readonly profile = computed(() =>
		this.#profileResource.hasValue()
			? this.#profileResource.value()
			: undefined,
	);
	readonly loading = computed(() => this.#profileResource.isLoading());
	readonly notFound = computed(() => !!this.#profileResource.error());

	readonly #gamesResource = httpResource<PublicProfileGamesResponse>(
		() => `${this.#base}/profile/${this.#username}/games`,
	);
	readonly #allGames = computed(() =>
		this.#gamesResource.hasValue()
			? (this.#gamesResource.value()?.data ?? [])
			: [],
	);
	readonly gamesLoading = computed(() => this.#gamesResource.isLoading());

	readonly #xpResource = httpResource<PublicXpResponse>(
		() => `${this.#base}/profile/${this.#username}/xp`,
	);
	readonly xpProfile = computed(() =>
		this.#xpResource.hasValue() ? this.#xpResource.value() : undefined,
	);
	readonly xpLoading = computed(() => this.#xpResource.isLoading());

	readonly ownedGames = computed(() =>
		this.#allGames().filter((g) => g.status === "owned"),
	);
	readonly recentGames = computed(() => this.ownedGames().slice(0, 8));
	readonly wantToPlayGames = computed(() =>
		this.#allGames().filter((g) => g.status === "want_to_play"),
	);
	readonly wantToTryGames = computed(() =>
		this.#allGames().filter((g) => g.status === "want_to_try"),
	);

	readonly ownedCount = computed(() => this.ownedGames().length);
	readonly wantToPlayCount = computed(() => this.wantToPlayGames().length);
	readonly wantToTryCount = computed(() => this.wantToTryGames().length);

	readonly tierLabel = computed(
		() => LEVEL_TIERS[this.xpProfile()?.level ?? 1] ?? "Novice",
	);

	readonly tierColors = computed(() => {
		const level = this.xpProfile()?.level ?? 1;
		if (level >= 10)
			return {
				bg: "bg-purple-500",
				ring: "ring-purple-300",
				text: "text-purple-600",
				bar: "bg-purple-500",
				pill: "bg-purple-100 text-purple-700",
			};
		if (level >= 7)
			return {
				bg: "bg-amber-500",
				ring: "ring-amber-300",
				text: "text-amber-600",
				bar: "bg-amber-500",
				pill: "bg-amber-100 text-amber-700",
			};
		if (level >= 4)
			return {
				bg: "bg-indigo-500",
				ring: "ring-indigo-300",
				text: "text-indigo-600",
				bar: "bg-indigo-500",
				pill: "bg-indigo-100 text-indigo-700",
			};
		return {
			bg: "bg-emerald-500",
			ring: "ring-emerald-300",
			text: "text-emerald-600",
			bar: "bg-emerald-500",
			pill: "bg-emerald-100 text-emerald-700",
		};
	});

	readonly memberSince = computed(() => {
		const p = this.profile();
		if (!p?.createdAt) return "";
		return new Date(p.createdAt).toLocaleDateString("en-GB", {
			month: "long",
			year: "numeric",
		});
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
		return new Date(birthday).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	}
}
