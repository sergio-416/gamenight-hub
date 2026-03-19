import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	HostListener,
	computed,
	inject,
	input,
	output,
	signal,
} from "@angular/core";
import { translateSignal } from "@jsverse/transloco";
import type { EventCategory } from "@gamenight-hub/shared";

@Component({
	selector: "app-category-filter-bar",
	host: { class: "block" },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./category-filter-bar.html",
})
export class CategoryFilterBar {
	readonly #elRef = inject(ElementRef);

	readonly activeCategory = input.required<EventCategory | "all">();
	readonly categoryChange = output<EventCategory | "all">();
	readonly open = signal(false);

	readonly #all = translateSignal(
		"categories.all",
		{},
		{ scope: "game-nights" },
	);
	readonly #strategy = translateSignal(
		"categories.strategy",
		{},
		{ scope: "game-nights" },
	);
	readonly #rpg = translateSignal(
		"categories.rpg",
		{},
		{ scope: "game-nights" },
	);
	readonly #party = translateSignal(
		"categories.party",
		{},
		{ scope: "game-nights" },
	);
	readonly #classic = translateSignal(
		"categories.classic",
		{},
		{ scope: "game-nights" },
	);
	readonly #cooperative = translateSignal(
		"categories.cooperative",
		{},
		{ scope: "game-nights" },
	);
	readonly #trivia = translateSignal(
		"categories.trivia",
		{},
		{ scope: "game-nights" },
	);
	readonly #miniatures = translateSignal(
		"categories.miniatures",
		{},
		{ scope: "game-nights" },
	);
	readonly #family = translateSignal(
		"categories.family",
		{},
		{ scope: "game-nights" },
	);
	readonly #other = translateSignal(
		"categories.other",
		{},
		{ scope: "game-nights" },
	);
	readonly #fallback = translateSignal(
		"categories.fallback",
		{},
		{ scope: "game-nights" },
	);

	readonly categories = computed(() => [
		{ key: "all" as const, label: this.#all() },
		{ key: "strategy" as const, label: this.#strategy() },
		{ key: "rpg" as const, label: this.#rpg() },
		{ key: "party" as const, label: this.#party() },
		{ key: "classic" as const, label: this.#classic() },
		{ key: "cooperative" as const, label: this.#cooperative() },
		{ key: "trivia" as const, label: this.#trivia() },
		{ key: "miniatures" as const, label: this.#miniatures() },
		{ key: "family" as const, label: this.#family() },
		{ key: "other" as const, label: this.#other() },
	]);

	activeLabel = computed(() => {
		const found = this.categories().find(
			(c) => c.key === this.activeCategory(),
		);
		return found?.label ?? this.#fallback();
	});

	select(key: EventCategory | "all"): void {
		this.categoryChange.emit(key);
		this.open.set(false);
	}

	@HostListener("document:click", ["$event.target"])
	onClickOutside(target: EventTarget | null): void {
		if (target instanceof Node && !this.#elRef.nativeElement.contains(target)) {
			this.open.set(false);
		}
	}
}
