import { Injectable, inject, signal } from "@angular/core";
import { SwUpdate, type VersionReadyEvent } from "@angular/service-worker";
import { filter } from "rxjs";

@Injectable({ providedIn: "root" })
export class PwaUpdateService {
	readonly #swUpdate = inject(SwUpdate);
	readonly updateAvailable = signal(false);

	constructor() {
		if (!this.#swUpdate.isEnabled) return;

		this.#swUpdate.versionUpdates
			.pipe(
				filter(
					(event): event is VersionReadyEvent => event.type === "VERSION_READY",
				),
			)
			.subscribe(() => {
				this.updateAvailable.set(true);
			});
	}

	applyUpdate(): void {
		document.location.reload();
	}

	dismissUpdate(): void {
		this.updateAvailable.set(false);
	}
}
