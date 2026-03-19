import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
} from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
	faCalendarPlus,
	faDiceD6,
	faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { TranslocoDirective, TranslocoService } from "@jsverse/transloco";
import type { XpAction, XpTransaction } from "@shared/models/xp.model";
import { XpService } from "@shared/services/xp.service";

const ACTION_ICONS: Record<XpAction, typeof faDiceD6> = {
	game_added: faDiceD6,
	event_created: faCalendarPlus,
	participant_joined: faUserPlus,
};

const ACTION_KEYS: Record<XpAction, string> = {
	game_added: "xp.history.actions.gameAdded",
	event_created: "xp.history.actions.eventCreated",
	participant_joined: "xp.history.actions.participantJoined",
};

@Component({
	selector: "app-xp-history",
	host: { class: "block" },
	imports: [FaIconComponent, TranslocoDirective],
	templateUrl: "./xp-history.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpHistory {
	readonly #xpService = inject(XpService);
	readonly #transloco = inject(TranslocoService);

	readonly transactions = signal<XpTransaction[]>([]);
	readonly loading = signal(false);
	readonly currentPage = signal(1);
	readonly totalPages = signal(0);
	readonly hasMore = computed(() => this.currentPage() < this.totalPages());

	constructor() {
		this.loadPage(1);
	}

	loadMore(): void {
		this.loadPage(this.currentPage() + 1);
	}

	getActionIcon(action: XpAction): typeof faDiceD6 {
		return ACTION_ICONS[action];
	}

	getActionLabel(action: XpAction): string {
		return this.#transloco.translate(ACTION_KEYS[action]);
	}

	formatRelativeTime(dateStr: string): string {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diffMs = now - then;
		const diffMin = Math.floor(diffMs / 60_000);

		if (diffMin < 1)
			return this.#transloco.translate("xp.history.timeAgo.justNow");
		if (diffMin < 60)
			return this.#transloco.translate("xp.history.timeAgo.minutesAgo", {
				count: diffMin,
			});
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24)
			return this.#transloco.translate("xp.history.timeAgo.hoursAgo", {
				count: diffHr,
			});
		const diffDay = Math.floor(diffHr / 24);
		if (diffDay < 30)
			return this.#transloco.translate("xp.history.timeAgo.daysAgo", {
				count: diffDay,
			});
		const diffMonth = Math.floor(diffDay / 30);
		return this.#transloco.translate("xp.history.timeAgo.monthsAgo", {
			count: diffMonth,
		});
	}

	private loadPage(page: number): void {
		this.loading.set(true);
		this.#xpService.getHistory(page, 10).subscribe({
			next: (res) => {
				this.transactions.update((prev) => [...prev, ...res.data]);
				this.currentPage.set(res.page);
				this.totalPages.set(res.totalPages);
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
			},
		});
	}
}
