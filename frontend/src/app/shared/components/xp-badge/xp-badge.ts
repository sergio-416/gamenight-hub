import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { TranslocoDirective, TranslocoService } from "@jsverse/transloco";
import { LEVEL_TITLES } from "@shared/models/xp.model";
import { XpService } from "@shared/services/xp.service";

@Component({
	selector: "app-xp-badge",
	host: { class: "block" },
	imports: [RouterLink, FaIconComponent, TranslocoDirective],
	templateUrl: "./xp-badge.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpBadge {
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);
	readonly iconShield = faShieldHalved;

	readonly profile = this.#xpService.profile;
	readonly loading = this.#xpService.profileLoading;

	readonly level = computed(() => this.profile()?.level ?? 0);
	readonly progressPercent = computed(
		() => this.profile()?.progressPercent ?? 0,
	);

	readonly tooltipText = computed(() => {
		const p = this.profile();
		if (!p) return "";
		const title = LEVEL_TITLES[p.level] ?? "Unknown";
		return this.#transloco.translate("xp.badge.tooltip", {
			level: p.level,
			title,
			current: p.xpTotal,
			next: p.nextLevelXp,
		});
	});
}
