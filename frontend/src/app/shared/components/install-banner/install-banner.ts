import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { PwaInstallService } from "@core/services/pwa-install.service";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
	selector: "app-install-banner",
	host: { class: "block" },
	imports: [TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ng-container *transloco="let t">
			@if (pwaInstallService.canInstall()) {
				<div
					data-testid="install-banner"
					class="fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-emerald-500/30"
				>
					<div
						class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div
								class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="w-5 h-5 text-emerald-400"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="7 10 12 15 17 10" />
									<line x1="12" y1="15" x2="12" y2="3" />
								</svg>
							</div>
							<p class="text-sm text-white font-medium truncate">
								{{ t("pwa.install.message") }}
							</p>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<button
								data-testid="install-dismiss-btn"
								type="button"
								class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
								(click)="pwaInstallService.dismiss()"
							>
								{{ t("pwa.install.dismiss") }}
							</button>
							<button
								data-testid="install-action-btn"
								type="button"
								class="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
								(click)="pwaInstallService.promptInstall()"
							>
								{{ t("pwa.install.action") }}
							</button>
						</div>
					</div>
				</div>
			}
		</ng-container>
	`,
})
export class InstallBanner {
	readonly pwaInstallService = inject(PwaInstallService);
}
