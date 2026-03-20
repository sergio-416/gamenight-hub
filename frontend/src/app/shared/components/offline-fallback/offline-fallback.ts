import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-offline-fallback',
	imports: [TranslocoDirective],
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div
			*transloco="let t"
			data-testid="offline-fallback"
			class="flex flex-col items-center justify-center min-h-screen gap-6 px-4 bg-surface text-on-surface"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-20 text-on-surface-muted"
			>
				<line x1="1" y1="1" x2="23" y2="23" />
				<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
				<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
				<path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
				<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
				<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
				<line x1="12" y1="20" x2="12.01" y2="20" />
			</svg>

			<h1 class="text-2xl font-bold text-on-surface-strong">
				{{ t("pwa.offline.title") }}
			</h1>

			<p class="text-center text-on-surface-muted max-w-md">
				{{ t("pwa.offline.message") }}
			</p>

			<button
				data-testid="offline-retry-btn"
				type="button"
				(click)="retry()"
				class="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 active:bg-emerald-700"
			>
				{{ t("pwa.offline.retry") }}
			</button>
		</div>
	`,
})
export class OfflineFallback {
	readonly #router = inject(Router);
	readonly #destroyRef = inject(DestroyRef);
	readonly isOnline = signal(navigator.onLine);

	constructor() {
		afterNextRender(() => {
			const handler = () => {
				this.isOnline.set(true);
				this.#router.navigateByUrl('/home');
			};

			window.addEventListener('online', handler);

			this.#destroyRef.onDestroy(() => {
				window.removeEventListener('online', handler);
			});
		});
	}

	retry(): void {
		window.location.reload();
	}
}
