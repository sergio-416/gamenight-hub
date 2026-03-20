import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaUpdateService } from '@core/services/pwa-update.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-update-banner',
	host: { class: 'block' },
	imports: [TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ng-container *transloco="let t">
			@if (pwaUpdateService.updateAvailable()) {
			<div
				class="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 bg-emerald-600 px-4 py-3 text-white shadow-lg sm:px-6"
				data-testid="update-banner"
			>
				<div class="flex items-center gap-3">
					<svg
						class="h-5 w-5 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 12a9 9 0 1 1-6.22-8.56" />
						<path d="M21 3v6h-6" />
					</svg>
					<span class="text-sm font-medium">
						{{ t('pwa.update.message') }}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
						data-testid="update-later-btn"
						(click)="pwaUpdateService.dismissUpdate()"
					>
						{{ t('pwa.update.later') }}
					</button>
					<button
						type="button"
						class="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
						data-testid="update-reload-btn"
						(click)="pwaUpdateService.applyUpdate()"
					>
						{{ t('pwa.update.reload') }}
					</button>
				</div>
			</div>
			}
		</ng-container>
	`,
})
export class UpdateBanner {
	readonly pwaUpdateService = inject(PwaUpdateService);
}
