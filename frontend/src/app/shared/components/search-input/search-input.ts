import {
	ChangeDetectionStrategy,
	Component,
	type ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';

@Component({
	selector: 'app-search-input',
	host: { class: 'block' },
	templateUrl: './search-input.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
	value = input('');
	placeholder = input('Search...');
	ariaLabel = input('Search');

	valueChange = output<string>();
	search = output<void>();
	focused = output<void>();
	blurred = output<void>();

	readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

	onInput(event: Event): void {
		this.valueChange.emit((event.target as HTMLInputElement).value);
	}

	clear(): void {
		this.valueChange.emit('');
		this.inputRef()?.nativeElement.focus();
	}
}
