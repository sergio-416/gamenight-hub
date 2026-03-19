import { NgOptimizedImage } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import type { EnrichedGame } from "@collection/models/game.model";
import { GamesService } from "@collection/services/games";
import { API_CONFIG } from "@core/config/api.config";
import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { ImageLightbox } from "@shared/components/image-lightbox";
import { TranslocoDirective, TranslocoService } from "@jsverse/transloco";
import { map } from "rxjs";
import { GameRecommendations } from "../game-recommendations/game-recommendations";
import { GameStatCards } from "../game-stat-cards/game-stat-cards";
import { GameTagSection } from "../game-tag-section/game-tag-section";

@Component({
	selector: "app-game-detail",
	host: { class: "block" },
	templateUrl: "./game-detail.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgOptimizedImage,
		TranslocoDirective,
		ConfirmDialog,
		ImageLightbox,
		GameStatCards,
		GameTagSection,
		GameRecommendations,
	],
})
export class GameDetail {
	readonly #route = inject(ActivatedRoute);
	readonly #router = inject(Router);
	readonly #gamesService = inject(GamesService);
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$, { initialValue: "" });
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly #gameId = toSignal(
		this.#route.paramMap.pipe(map((params) => params.get("id") ?? "")),
		{
			initialValue: "",
		},
	);

	readonly gameResource = httpResource<EnrichedGame>(() => {
		const id = this.#gameId();
		if (!id) return undefined;
		return `${this.#apiUrl}${API_CONFIG.endpoints.games}/${id}/enriched`;
	});

	readonly game = computed(() =>
		this.gameResource.error() ? null : (this.gameResource.value() ?? null),
	);
	readonly loading = computed(() => this.gameResource.isLoading());
	readonly error = computed(() => this.gameResource.error());

	readonly lightboxOpen = signal(false);
	readonly heroSrc = computed(
		() => this.game()?.imageUrl ?? this.game()?.thumbnailUrl ?? null,
	);

	readonly weightLabel = computed(() => {
		this.#lang();
		const c = this.game()?.complexity;
		if (c == null || c < 1 || c > 5)
			return this.#transloco.translate("collection.weight.notRated");
		return this.#transloco.translate(`collection.weight.${c}`);
	});

	readonly showRecommendations = computed(
		() => (this.game()?.recommendations?.length ?? 0) > 0,
	);

	readonly showCta = computed(() => {
		const recs = this.game()?.recommendations?.length ?? 0;
		return recs > 0 && recs < 5;
	});

	readonly primaryCta = computed(() => {
		const status = this.game()?.status;
		if (status === "owned") return "owned" as const;
		return "add" as const;
	});

	readonly showSecondary = computed(() => {
		const status = this.game()?.status;
		return status !== "owned" && status !== "want_to_play";
	});

	readonly statusLabel = computed(() => {
		this.#lang();
		const status = this.game()?.status ?? "";
		const keyMap: Record<string, string> = {
			owned: "collection.status.owned",
			want_to_play: "collection.status.wantToPlay",
			want_to_try: "collection.status.wantToTry",
			played: "collection.status.played",
		};
		const key = keyMap[status];
		return key ? this.#transloco.translate(key) : status;
	});

	openLightbox(): void {
		if (this.heroSrc()) this.lightboxOpen.set(true);
	}

	closeLightbox(): void {
		this.lightboxOpen.set(false);
	}

	goBack(): void {
		this.#router.navigate(["/collection"]);
	}

	onGameClick(gameId: string): void {
		this.#router.navigate(["/collection", gameId]);
	}

	onAddClick(): void {
		this.#router.navigate(["/collection/import"]);
	}

	readonly removeDialogOpen = signal(false);

	readonly removeDialogMessage = computed(() => {
		const game = this.game();
		if (!game) return "";
		return this.#transloco.translate("collection.removeConfirmMessage", {
			name: game.name,
		});
	});

	requestRemove(): void {
		if (!this.game()) return;
		this.removeDialogOpen.set(true);
	}

	cancelRemove(): void {
		this.removeDialogOpen.set(false);
	}

	confirmRemove(): void {
		const game = this.game();
		if (!game) return;
		this.removeDialogOpen.set(false);
		this.#gamesService.deleteGame(game.id).subscribe(() => {
			this.#router.navigate(["/collection"]);
		});
	}

	updateStatus(status: "owned" | "want_to_play"): void {
		const id = this.game()?.id;
		if (!id) return;
		this.#gamesService.updateGame(id, { status }).subscribe(() => {
			this.gameResource.reload();
		});
	}
}
