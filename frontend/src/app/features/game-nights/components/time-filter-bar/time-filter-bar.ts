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
import type { FilterPresetKey } from '@game-nights/utils/date-range';
import { translateSignal } from '@jsverse/transloco';

const _PRESET_KEYS = ['this-week', 'next-7d', 'next-14d', 'this-month', 'all'] as const;

const _PRESET_I18N: Record<string, string> = {
	'this-week': 'game-nights.timeFilter.thisWeek',
	'next-7d': 'game-nights.timeFilter.next7d',
	'next-14d': 'game-nights.timeFilter.next14d',
	'this-month': 'game-nights.tmeFilter.thisMonth',
	all: 'game-nights.timeFilter.all',
};

@Component({
	selector: 'app-time-filter-bar',
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './time-filter-bar.html',
})
export class TimeFilterBar {
	readonly #elRef = inject(ElementRef);

	readonly activePreset = input.required<FilterPresetKey>();
	readonly presetChange = output<FilterPresetKey>();
	readonly open = signal(false);

	readonly #thisWeek = translateSignal('timeFilter.thisWeek', {}, { scope: 'game-nights' });
	readonly #next7d = translateSignal('timeFilter.next7d', {}, { scope: 'game-nights' });
	readonly #next14d = translateSignal('timeFilter.next14d', {}, { scope: 'game-nights' });
	readonly #thisMonth = translateSignal('timeFilter.thisMonth', {}, { scope: 'game-nights' });
	readonly #all = translateSignal('timeFilter.all', {}, { scope: 'game-nights' });
	readonly #fallback = translateSignal('timeFilter.fallback', {}, { scope: 'game-nights' });

	readonly presets = computed(() => [
		{ key: 'this-week' as const, label: this.#thisWeek() },
		{ key: 'next-7d' as const, label: this.#next7d() },
		{ key: 'next-14d' as const, label: this.#next14d() },
		{ key: 'this-month' as const, label: this.#thisMonth() },
		{ key: 'all' as const, label: this.#all() },
	]);

	activeLabel = computed(() => {
		const found = this.presets().find((p) => p.key === this.activePreset());
		return found?.label ?? this.#fallback();
	});

	select(key: FilterPresetKey): void {
		this.presetChange.emit(key);
		this.open.set(false);
	}

	@HostListener('document:click', ['$event.target'])
	onClickOutside(target: EventTarget | null): void {
		if (target instanceof Node && !this.#elRef.nativeElement.contains(target)) {
			this.open.set(false);
		}
	}
}
