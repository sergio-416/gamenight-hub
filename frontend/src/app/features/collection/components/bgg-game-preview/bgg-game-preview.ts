import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse, httpResource } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import type { BggGameDetail } from "@collection/models/game.model";
import { GamesService } from "@collection/services/games";
import { API_CONFIG } from "@core/config/api.config";
import { ToastService } from "@core/services/toast";
import { ImageLightbox } from "@shared/components/image-lightbox";
import { map } from "rxjs";
import { TranslocoDirective } from "@jsverse/transloco";
import { GameTagSection } from "../game-tag-section/game-tag-section";

@Component({
	selector: "app-bgg-game-preview",
	host: { class: "block" },
	templateUrl: "./bgg-game-preview.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgOptimizedImage,
		RouterLink,
		ImageLightbox,
		GameTagSection,
		TranslocoDirective,
	],
})
export class BggGamePreview {
	readonly #route = inject(ActivatedRoute);
	readonly #gamesService = inject(GamesService);
	readonly #toastService = inject(ToastService);
	readonly #apiUrl = API_CONFIG.baseUrl;

	readonly #queryParams = toSignal(this.#route.queryParams, {
		initialValue: {} as Record<string, string>,
	});
	readonly backQuery = computed(() => this.#queryParams()["q"] ?? "");

	readonly #bggId = toSignal(
		this.#route.paramMap.pipe(map((params) => params.get("bggId") ?? "")),
		{
			initialValue: "",
		},
	);

	readonly gameResource = httpResource<BggGameDetail>(() => {
		const id = this.#bggId();
		if (!id) return undefined;
		return `${this.#apiUrl}${API_CONFIG.endpoints.bggGame}/${id}`;
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

	readonly #manuallyImported = signal(false);
	readonly imported = computed(() => {
		if (this.#manuallyImported()) return true;
		const game = this.game();
		return game ? this.#gamesService.ownedBggIds().has(game.bggId) : false;
	});
	readonly importing = signal(false);

	openLightbox(): void {
		if (this.heroSrc()) this.lightboxOpen.set(true);
	}

	closeLightbox(): void {
		this.lightboxOpen.set(false);
	}

	importGame(): void {
		const game = this.game();
		if (!game) return;

		this.importing.set(true);

		this.#gamesService.importGame(game.bggId, { status: "owned" }).subscribe({
			next: () => {
				this.#manuallyImported.set(true);
				this.importing.set(false);
				this.#toastService.success("Game added to your collection!");
			},
			error: (err: unknown) => {
				if (err instanceof HttpErrorResponse && err.status === 409) {
					this.#manuallyImported.set(true);
					this.importing.set(false);
					this.#toastService.info("Game is already in your collection.");
					return;
				}
				this.importing.set(false);
				this.#toastService.error("Failed to import game. Please try again.");
			},
		});
	}
}
