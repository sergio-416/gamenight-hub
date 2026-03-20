import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast';

@Component({
	selector: 'app-toast-container',
	imports: [],
	templateUrl: './toast-container.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
	readonly #toastService = inject(ToastService);
	readonly toasts = this.#toastService.toasts;

	dismiss(id: string): void {
		this.#toastService.dismiss(id);
	}
}
