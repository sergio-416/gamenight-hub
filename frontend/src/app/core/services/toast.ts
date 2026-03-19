import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Injectable, inject, signal } from "@angular/core";

export interface Toast {
	id: string;
	message: string;
	type: "success" | "error" | "info" | "warning";
	duration?: number;
}

@Injectable({
	providedIn: "root",
})
export class ToastService {
	readonly #liveAnnouncer = inject(LiveAnnouncer);
	readonly #toasts = signal<Toast[]>([]);
	readonly toasts = this.#toasts.asReadonly();

	#nextId = 0;

	show(message: string, type: Toast["type"] = "info", duration = 3000): void {
		const id = `toast-${this.#nextId++}`;
		const toast: Toast = { id, message, type, duration };

		this.#toasts.update((toasts) => [...toasts, toast]);
		this.#liveAnnouncer.announce(
			message,
			type === "error" ? "assertive" : "polite",
		);

		if (duration > 0) {
			setTimeout(() => this.dismiss(id), duration);
		}
	}

	success(message: string, duration = 3000): void {
		this.show(message, "success", duration);
	}

	error(message: string, duration = 5000): void {
		this.show(message, "error", duration);
	}

	info(message: string, duration = 3000): void {
		this.show(message, "info", duration);
	}

	warning(message: string, duration = 4000): void {
		this.show(message, "warning", duration);
	}

	dismiss(id: string): void {
		this.#toasts.update((toasts) => toasts.filter((t) => t.id !== id));
	}
}
