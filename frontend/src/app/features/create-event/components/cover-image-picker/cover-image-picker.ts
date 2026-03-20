import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { EVENT_COVERS, type EventCoverSlug, getEventCoverPath } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-cover-image-picker',
	imports: [CdkTrapFocus, NgOptimizedImage, TranslocoDirective],
	templateUrl: './cover-image-picker.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'(keydown.escape)': 'close()',
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
