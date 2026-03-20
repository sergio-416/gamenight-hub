import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
	selector: 'app-confirm-dialog',
	imports: [A11yModule],
	templateUrl: './confirm-dialog.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'(keydown.escape)': 'onCancel()',
	},
})
export class ConfirmDialog {
	readonly isOpen = input.required<boolean>();
	readonly title = input<string>('Confirm Action');
	readonly message = input.required<string>();
	readonly confirmText = input<string>('Confirm');
	readonly cancelText = input<string>('Cancel');
	readonly danger = input<boolean>(false);

	readonly confirmed = output<void>();
	readonly cancelled = output<void>();

	handleBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.cancelled.emit();
		}
	}

	onConfirm(): void {
		this.confirmed.emit();
	}

	onCancel(): void {
		this.cancelled.emit();
	}
}
