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
import { SORT_MODE, type SortMode } from '@collection/models/collection.types';
import { translateSignal } from '@jsverse/transloco';

@Component({
	selector: 'app-sort-pill',
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './sort-pill.html',
})
export class SortPill {
	private readonly el = inject(ElementRef);

	activeSort = input.required<SortMode>();
	sortChange = output<SortMode>();
	open = signal(false);

	private readonly nameAscLabel = translateSignal(
		'filters.sortNameAsc',
		{},
		{ scope: 'collection' },
	);
	private readonly nameDescLabel = translateSignal(
		'filters.sortNameDesc',
		{},
		{ scope: 'collection' },
	);
	private readonly newestLabel = translateSignal('filters.sortNewest', {}, { scope: 'collection' });
	private readonly oldestLabel = translateSignal('filters.sortOldest', {}, { scope: 'collection' });

	options = computed(() => [
		{ key: SORT_MODE.NAME_ASC, label: this.nameAscLabel() },
		{ key: SORT_MODE.NAME_DESC, label: this.nameDescLabel() },
		{ key: SORT_MODE.NEWEST, label: this.newestLabel() },
		{ key: SORT_MODE.OLDEST, label: this.oldestLabel() },
	]);

	activeLabel = computed(() => {
		const match = this.options().find((o) => o.key === this.activeSort());
		return match?.label ?? '';
	});

	select(key: SortMode) {
		this.sortChange.emit(key);
		this.open.set(false);
	}

	@HostListener('document:click', ['$event.target'])
	onClickOutside(target: EventTarget | null): void {
		if (target instanceof Node && !this.el.nativeElement.contains(target)) {
			this.open.set(false);
		}
	}
}
