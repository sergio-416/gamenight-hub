import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast';
import type { Game } from '@features/collection/models/game.model';
import { GamesService } from '@features/collection/services/games';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBullseye, faDiceD6, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import type { GameStatus } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ProfileMarkPlayed } from '../profile-mark-played/profile-mark-played';

@Component({
	selector: 'app-profile-game-lists',
	imports: [
		NgOptimizedImage,
		FontAwesomeModule,
		RouterLink,
		TranslocoDirective,
		ConfirmDialog,
		ProfileMarkPlayed,
	],
	templateUrl: './profile-game-lists.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileGameLists {
	readonly ownedGames = input<Game[]>([]);
	readonly ownedCount = input(0);
	readonly recentGames = input<Game[]>([]);
	readonly wantToPlayGames = input<Game[]>([]);
	readonly wantToPlayCount = input(0);
	readonly wantToTryGames = input<Game[]>([]);
	readonly wantToTryCount = input(0);
	readonly gamesLoading = input(false);

	readonly addGameRequested = output<GameStatus>();
	readonly gamesChanged = output<void>();

	readonly #gamesService = inject(GamesService);
	readonly #toastService = inject(ToastService);

	readonly showRemoveConfirm = signal(false);
	readonly gameToRemove = signal<string | null>(null);

	readonly iconDice = faDiceD6;
	readonly iconBullseye = faBullseye;
	readonly iconPlus = faPlus;
	readonly iconTrash = faTrashCan;

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

		this.#gamesService.deleteGame(gameId).subscribe({
			next: () => {
				this.cancelRemoveWantToPlay();
				this.gamesChanged.emit();
			},
			error: () => {
				this.#toastService.error('Failed to remove game');
			},
		});
	}

	onMarkPlayedCompleted(): void {
		this.gamesChanged.emit();
	}
}
