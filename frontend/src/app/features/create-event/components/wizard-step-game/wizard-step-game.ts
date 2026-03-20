import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
	CATEGORY_META,
	EVENT_CATEGORY_LIST,
	type EventCategory,
	type EventCoverSlug,
	getEventCoverPath,
} from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { CoverImagePicker } from '../cover-image-picker/cover-image-picker';
import { GamePicker } from '../game-picker/game-picker';

interface GameSelection {
	id: string;
	name: string;
	thumbnailUrl?: string;
	categories?: string[];
}

@Component({
	selector: 'app-wizard-step-game',
	imports: [GamePicker, CoverImagePicker, NgOptimizedImage, TranslocoDirective],
	templateUrl: './wizard-step-game.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepGame {
	readonly title = input<string>('');
	readonly description = input<string>('');
	readonly selectedGameId = input<string | undefined>();
	readonly coverImage = input<string | undefined>();
	readonly category = input<EventCategory | undefined>();

	readonly titleChange = output<string>();
	readonly descriptionChange = output<string>();
	readonly gameSelected = output<GameSelection>();
	readonly gameCleared = output<void>();
	readonly coverImageChange = output<string>();
	readonly categoryChange = output<EventCategory | undefined>();

	readonly categories = EVENT_CATEGORY_LIST;
	readonly categoryMeta = CATEGORY_META;

	readonly #showCoverPicker = signal(false);
	readonly showCoverPicker = this.#showCoverPicker.asReadonly();

	readonly coverImagePath = computed(() => {
		const slug = this.coverImage();
		return slug ? getEventCoverPath(slug as EventCoverSlug) : '';
	});

	onTitleInput(event: globalThis.Event): void {
		this.titleChange.emit((event.target as HTMLInputElement).value);
	}

	onDescriptionInput(event: globalThis.Event): void {
		this.descriptionChange.emit((event.target as HTMLTextAreaElement).value);
	}

	onCategorySelect(value: EventCategory): void {
		this.categoryChange.emit(this.category() === value ? undefined : value);
	}

	openCoverPicker(): void {
		this.#showCoverPicker.set(true);
	}

	closeCoverPicker(): void {
		this.#showCoverPicker.set(false);
	}

	onCoverSelected(slug: EventCoverSlug): void {
		this.coverImageChange.emit(slug);
		this.closeCoverPicker();
	}
}
