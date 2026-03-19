import { Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

interface DialogRequest {
	message: string;
	title: string;
	confirmText: string;
	resolve: (result: boolean) => void;
}

@Injectable({ providedIn: "root" })
export class ConfirmDialogService {
	readonly #pending = signal<DialogRequest | null>(null);
	readonly pending = this.#pending.asReadonly();

	confirm(
		message: string,
		title = "Are you sure?",
		confirmText = "Leave",
	): Observable<boolean> {
		return new Observable((observer) => {
			this.#pending.set({
				message,
				title,
				confirmText,
				resolve: (result) => {
					this.#pending.set(null);
					observer.next(result);
					observer.complete();
				},
			});
		});
	}
}
