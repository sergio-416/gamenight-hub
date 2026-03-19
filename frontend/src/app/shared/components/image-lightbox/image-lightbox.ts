import { A11yModule } from "@angular/cdk/a11y";
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output,
} from "@angular/core";
import { NgOptimizedImage } from "@angular/common";

@Component({
	selector: "app-image-lightbox",
	imports: [A11yModule, NgOptimizedImage],
	templateUrl: "./image-lightbox.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"(keydown.escape)": "close()",
	},
})
export class ImageLightbox {
	readonly isOpen = input.required<boolean>();
	readonly src = input.required<string>();
	readonly alt = input<string>("");

	readonly closed = output<void>();

	handleBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.closed.emit();
		}
	}

	close(): void {
		this.closed.emit();
	}
}
