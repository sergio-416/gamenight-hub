import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from "@angular/core";
import { CATEGORY_META, type EventCategory } from "@gamenight-hub/shared";

@Component({
	selector: "app-category-badge",
	host: { class: "block" },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./category-badge.html",
})
export class CategoryBadge {
	readonly category = input.required<EventCategory | null | undefined>();

	readonly meta = computed(() => {
		const cat = this.category();
		return cat ? CATEGORY_META[cat] : null;
	});

	readonly badgeClass = computed(() => {
		const m = this.meta();
		if (!m) return null;
		return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.colorClass}`;
	});
}
