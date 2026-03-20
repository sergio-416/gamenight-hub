import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	HostListener,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { translateSignal } from '@jsverse/transloco';

@Component({
	selector: 'app-category-filter-pill',
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './category-filter-pill.html',
})
export class CategoryFilterPill {
	private readonly el = inject(ElementRef);

	activeCategory = input.required<string>();
	categories = input.required<string[]>();
	categoryChange = output<string>();

	open = signal(false);

	private readonly allLabel = translateSignal('filters.categoryAll', {}, { scope: 'collection' });

	options = computed(() => {
		const all = { key: 'all', label: this.allLabel() };
		return [all, ...this.categories().map((c) => ({ key: c, label: c }))];
	});

	activeLabel = computed(() =>
		this.activeCategory() === 'all' ? this.allLabel() : this.activeCategory(),
	);

	select(key: string) {
		this.categoryChange.emit(key);
		this.open.set(false);
	}

	@HostListener('document:click', ['$event.target'])
	onClickOutside(target: EventTarget | null): void {
		if (target instanceof Node && !this.el.nativeElement.contains(target)) {
			this.open.set(false);
		}
	}
}
