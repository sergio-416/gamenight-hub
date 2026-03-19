import {
	ChangeDetectionStrategy,
	Component,
	inject,
	viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@core/services/auth";
import { ToastService } from "@core/services/toast";
import { GamesService } from "@collection/services/games";
import { CollectionUnauthenticated } from "./components/collection-unauthenticated/collection-unauthenticated";
import { GameList } from "./components/game-list/game-list";

@Component({
	selector: "app-collection",
	imports: [GameList, CollectionUnauthenticated],
	templateUrl: "./collection.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collection {
	readonly #authService = inject(AuthService);
	readonly #router = inject(Router);
	readonly #toastService = inject(ToastService);
	readonly #gamesService = inject(GamesService);

	readonly isLoggedIn = this.#authService.isLoggedIn;

	readonly gameListRef = viewChild<GameList>("gameList");

	onImportGame(): void {
		this.#router.navigate(["/collection/import"]);
	}

	onGameClick(gameId: string): void {
		this.#router.navigate(["/collection", gameId]);
	}

	onGameDeleted(gameId: string): void {
		this.#gamesService.deleteGame(gameId).subscribe({
			next: () => {
				this.#toastService.success("Game removed from collection");
				this.gameListRef()?.gamesResource.reload();
			},
			error: () => {
				this.#toastService.error("Failed to remove game from collection");
			},
		});
	}
}
