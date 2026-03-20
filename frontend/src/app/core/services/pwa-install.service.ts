import { afterNextRender, computed, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pwa-install-dismissed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
	readonly #deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
	readonly #isDismissed = signal(this.#checkDismissed());

	readonly canInstall = computed(() => this.#deferredPrompt() !== null && !this.#isDismissed());

	constructor() {
		afterNextRender(() => {
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				this.#deferredPrompt.set(e);
			});

			window.addEventListener('appinstalled', () => {
				this.#deferredPrompt.set(null);
			});
		});
	}

	async promptInstall(): Promise<void> {
		const prompt = this.#deferredPrompt();
		if (!prompt) return;

		await prompt.prompt();
		this.#deferredPrompt.set(null);
	}

	dismiss(): void {
		this.#isDismissed.set(true);
		localStorage.setItem(STORAGE_KEY, new Date().toISOString());
	}

	#checkDismissed(): boolean {
		if (typeof localStorage === 'undefined') return false;

		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return false;

		const dismissed = new Date(stored).getTime();
		return Date.now() - dismissed < COOLDOWN_MS;
	}
}
