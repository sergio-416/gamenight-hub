import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { TranslocoDirective, TranslocoService } from "@jsverse/transloco";
import { XpService } from "@shared/services/xp.service";

@Component({
	selector: "app-xp-feedback",
	host: { class: "block" },
	imports: [TranslocoDirective],
	templateUrl: "./xp-feedback.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpFeedback {
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$);

	readonly feedback = this.#xpService.xpFeedback;

	readonly isLevelUp = computed(() => this.feedback()?.levelUp ?? false);

	readonly levelTitle = computed(() => {
		this.#lang();
		const newLevel = this.feedback()?.newLevel;
		if (!newLevel) return "";
		return this.#transloco.translate(`levelTitles.${newLevel}`);
	});
}
