import { NgOptimizedImage } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output,
} from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";
import type { Game } from "../../models/game.model";

@Component({
	selector: "app-game-recommendations",
	host: { class: "block" },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgOptimizedImage, TranslocoDirective],
	templateUrl: "./game-recommendations.html",
})
export class GameRecommendations {
	recommendations = input<Game[]>([]);
	showCta = input(false);
	gameClick = output<string>();
	addClick = output<void>();
}
