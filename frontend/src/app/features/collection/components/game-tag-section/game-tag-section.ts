import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
	selector: "app-game-tag-section",
	imports: [TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./game-tag-section.html",
	host: { class: "flex flex-col gap-4" },
})
export class GameTagSection {
	isExpansion = input(false);
	categories = input<string[]>([]);
	mechanics = input<string[]>([]);
}
