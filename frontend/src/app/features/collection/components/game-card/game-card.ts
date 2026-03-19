import { NgOptimizedImage } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	output,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { TranslocoService } from "@jsverse/transloco";
import type { Game } from "@collection/models/game.model";
import { STATUS_COLORS } from "@collection/models/collection.types";

const STATUS_I18N: Record<string, string> = {
	owned: "collection.status.owned",
	want_to_play: "collection.status.wantToPlay",
	want_to_try: "collection.status.wantToTry",
	played: "collection.status.played",
};

const WEIGHT_I18N: Record<number, string> = {
	1: "collection.weight.1",
	2: "collection.weight.2",
	3: "collection.weight.3",
	4: "collection.weight.4",
	5: "collection.weight.5",
};

@Component({
	selector: "app-game-card",
	imports: [NgOptimizedImage],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "block" },
	templateUrl: "./game-card.html",
})
export class GameCard {
	readonly #transloco = inject(TranslocoService);
	readonly #lang = toSignal(this.#transloco.langChanges$);

	game = input.required<Game>();
	priorityImage = input(false);

	gameClick = output<string>();

	readonly playerRange = computed(() => {
		this.#lang();
		const g = this.game();
		if (g.minPlayers && g.maxPlayers) {
			if (g.minPlayers === g.maxPlayers) {
				return g.minPlayers === 1
					? this.#transloco.translate("collection.card.playersSingular", {
							count: g.minPlayers,
						})
					: this.#transloco.translate("collection.card.playersPlural", {
							count: g.minPlayers,
						});
			}
			return this.#transloco.translate("collection.card.playersRange", {
				min: g.minPlayers,
				max: g.maxPlayers,
			});
		}
		return null;
	});

	readonly complexityLabel = computed(() => {
		this.#lang();
		const c = this.game().complexity;
		if (c && c >= 1 && c <= 5) {
			const key = WEIGHT_I18N[c as keyof typeof WEIGHT_I18N];
			return key ? this.#transloco.translate(key) : null;
		}
		return null;
	});

	readonly statusColor = computed(() => {
		const status = this.game().status;
		return status ? STATUS_COLORS[status] : "";
	});

	readonly statusLabel = computed(() => {
		this.#lang();
		const status = this.game().status;
		if (!status) return "";
		const key = STATUS_I18N[status];
		return key ? this.#transloco.translate(key) : status;
	});

	readonly primaryCategory = computed(() => {
		const cats = this.game().categories;
		return cats?.length ? cats[0] : null;
	});

	readonly badgeLabel = computed(() => {
		const status = this.game().status;
		if (status === "owned") return this.primaryCategory() ?? this.statusLabel();
		return this.statusLabel();
	});

	readonly badgeColor = computed(() => {
		const status = this.game().status;
		if (status === "owned" && this.primaryCategory()) return "bg-slate-100 text-on-surface-muted";
		return this.statusColor();
	});
}
