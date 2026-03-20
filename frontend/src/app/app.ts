import { Component, computed, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map } from "rxjs";
import { ConfirmDialogService } from "./core/services/confirm-dialog.service";
import { ConfirmDialog } from "./shared/components/confirm-dialog/confirm-dialog";
import { Footer } from "./shared/components/footer/footer";
import { Header } from "./shared/components/header/header";
import { InstallBanner } from "./shared/components/install-banner/install-banner";
import { LevelUpToast } from "./shared/components/level-up-toast/level-up-toast";
import { ToastContainer } from "./shared/components/toast-container/toast-container";
import { UpdateBanner } from "./shared/components/update-banner/update-banner";
import { XpFeedback } from "./shared/components/xp-feedback/xp-feedback";
import { LEVEL_TITLES } from "./shared/models/xp.model";
import { XpService } from "./shared/services/xp.service";

@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		Header,
		Footer,
		ToastContainer,
		ConfirmDialog,
		XpFeedback,
		LevelUpToast,
		UpdateBanner,
		InstallBanner,
	],
	templateUrl: "./app.html",
})
export class App {
	readonly #router = inject(Router);
	readonly confirmDialog = inject(ConfirmDialogService);
	readonly #xpService = inject(XpService);

	readonly #currentUrl = toSignal(
		this.#router.events.pipe(
			filter((e) => e instanceof NavigationEnd),
			map((e) => (e as NavigationEnd).urlAfterRedirects),
		),
		{ initialValue: this.#router.url },
	);

	readonly showChrome = computed(() => {
		const url = this.#currentUrl();
		return (
			!url.startsWith("/login") &&
			!url.startsWith("/auth/") &&
			!url.startsWith("/profile/setup")
		);
	});

	readonly #levelUpData = signal<{ level: number; title: string } | null>(null);
	readonly levelUpData = this.#levelUpData.asReadonly();

	constructor() {
		effect(() => {
			const fb = this.#xpService.xpFeedback();
			if (fb?.levelUp && fb.newLevel) {
				this.#levelUpData.set({
					level: fb.newLevel,
					title: LEVEL_TITLES[fb.newLevel] ?? "",
				});
			}
		});
	}
}
