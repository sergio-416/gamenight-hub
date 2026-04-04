import { NgOptimizedImage } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { ToastService } from '@core/services/toast';
import type { Game } from '@features/collection/models/game.model';
import { GamesService } from '@features/collection/services/games';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
	faCheck,
	faCheckSquare,
	faPlus,
	faSquare,
	faWandMagicSparkles,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { GameStatus } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-profile-mark-played',
	imports: [FontAwesomeModule, NgOptimizedImage, TranslocoDirective, ConfirmDialog],
	templateUrl: './profile-mark-played.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMarkPlayed {
	readonly games = input.required<Game[]>();

	readonly completed = output<void>();
	readonly addGameRequested = output<GameStatus>();

	readonly #gamesService = inject(GamesService);
	readonly #toastService = inject(ToastService);

	readonly showMarkPlayedMode = signal(false);
	readonly selectedGamesForPlayed = signal<Set<string>>(new Set());
	readonly selectedPlayedCount = computed(() => this.selectedGamesForPlayed().size);
	readonly showMarkPlayedConfirm = signal(false);

	readonly iconCheck = faCheck;
	readonly iconSquare = faSquare;
	readonly iconCheckSquare = faCheckSquare;
	readonly iconX = faXmark;
	readonly iconPlus = faPlus;
	readonly iconWand = faWandMagicSparkles;

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

		forkJoin(gameIds.map((id) => this.#gamesService.markAsPlayed(id))).subscribe({
			next: () => {
				this.completed.emit();
			},
			error: () => {
				this.#toastService.error('Failed to mark games as played');
				this.completed.emit();
			},
		});

		this.selectedGamesForPlayed.set(new Set());
		this.showMarkPlayedConfirm.set(false);
		this.showMarkPlayedMode.set(false);
	}
}
