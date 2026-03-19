import {
	ChangeDetectionStrategy,
	Component,
	effect,
	input,
	output,
	signal,
	untracked,
} from "@angular/core";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgOptimizedImage } from "@angular/common";
import { TranslocoDirective } from "@jsverse/transloco";
import {
	EVENT_COVERS,
	getEventCoverPath,
	type EventCoverSlug,
} from "@gamenight-hub/shared";

@Component({
	selector: "app-cover-image-picker",
	imports: [CdkTrapFocus, NgOptimizedImage, TranslocoDirective],
	templateUrl: "./cover-image-picker.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"(keydown.escape)": "close()",
	},
})
export class CoverImagePicker {
	readonly isOpen = input.required<boolean>();
	readonly selectedSlug = input<string | undefined>();

	readonly selected = output<EventCoverSlug>();
	readonly closed = output<void>();

	readonly #internalSelection = signal<EventCoverSlug | undefined>(undefined);
	readonly internalSelection = this.#internalSelection.asReadonly();

	readonly allCovers = EVENT_COVERS;
	readonly getCoverPath = getEventCoverPath;

	readonly #resetEffect = effect(() => {
		const open = this.isOpen();
		untracked(() => {
			if (open) {
				this.#internalSelection.set(
					this.selectedSlug() as EventCoverSlug | undefined,
				);
			}
		});
	});

	selectCover(slug: EventCoverSlug): void {
		this.#internalSelection.set(slug);
	}

	confirm(): void {
		const slug = this.#internalSelection();
		if (slug) {
			this.selected.emit(slug);
			this.closed.emit();
		}
	}

	close(): void {
		this.closed.emit();
	}
}
