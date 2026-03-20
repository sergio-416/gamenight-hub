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
import { PLAYER_COUNT_FILTER, type PlayerCountFilter } from '@collection/models/collection.types';
import { translateSignal } from '@jsverse/transloco';

@Component({
	selector: 'app-player-count-filter-pill',
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './player-count-filter-pill.html',
})
export class PlayerCountFilterPill {
	readonly #elRef = inject(ElementRef);

	readonly activeCount = input.required<PlayerCountFilter>();
	readonly countChange = output<PlayerCountFilter>();
	readonly open = signal(false);

	readonly #any = translateSignal('filters.playersAny', {}, { scope: 'collection' });
	readonly #one = translateSignal('filters.players1', {}, { scope: 'collection' });
	readonly #two = translateSignal('filters.players2', {}, { scope: 'collection' });
	readonly #three = translateSignal('filters.players3', {}, { scope: 'collection' });
	readonly #four = translateSignal('filters.players4', {}, { scope: 'collection' });
	readonly #five = translateSignal('filters.players5', {}, { scope: 'collection' });
	readonly #sixPlus = translateSignal('filters.players6Plus', {}, { scope: 'collection' });

	readonly options = computed<{ key: PlayerCountFilter; label: string }[]>(() => [
		{ key: PLAYER_COUNT_FILTER.ANY, label: this.#any() },
		{ key: PLAYER_COUNT_FILTER.ONE, label: this.#one() },
		{ key: PLAYER_COUNT_FILTER.TWO, label: this.#two() },
		{ key: PLAYER_COUNT_FILTER.THREE, label: this.#three() },
		{ key: PLAYER_COUNT_FILTER.FOUR, label: this.#four() },
		{ key: PLAYER_COUNT_FILTER.FIVE, label: this.#five() },
		{ key: PLAYER_COUNT_FILTER.SIX_PLUS, label: this.#sixPlus() },
	]);

	readonly activeLabel = computed(() => {
		const found = this.options().find((o) => o.key === this.activeCount());
		return found?.label ?? this.#any();
	});

	select(key: PlayerCountFilter): void {
		this.countChange.emit(key);
		this.open.set(false);
	}

	@HostListener('document:click', ['$event.target'])
	onClickOutside(target: EventTarget | null): void {
		if (target instanceof Node && !this.#elRef.nativeElement.contains(target)) {
			this.open.set(false);
		}
	}
}
