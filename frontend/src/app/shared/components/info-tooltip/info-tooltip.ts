import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	signal,
} from "@angular/core";

const TOOLTIP_POSITION = {
	TOP: "top",
	BOTTOM: "bottom",
	LEFT: "left",
	RIGHT: "right",
} as const;

type TooltipPosition = (typeof TOOLTIP_POSITION)[keyof typeof TOOLTIP_POSITION];

const POSITION_CLASSES: Record<TooltipPosition, string> = {
	top: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg",
	bottom:
		"absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-max max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg",
	left: "absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-max max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg",
	right:
		"absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 w-max max-w-xs rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg",
};

let tooltipCounter = 0;

@Component({
	selector: "app-info-tooltip",
	host: { class: "block" },
	imports: [],
	templateUrl: "./info-tooltip.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTooltip {
	readonly text = input.required<string>();
	readonly position = input<TooltipPosition>(TOOLTIP_POSITION.TOP);

	readonly tooltipId = `tooltip-${++tooltipCounter}`;
	readonly visible = signal(false);

	readonly positionClasses = computed(() => POSITION_CLASSES[this.position()]);

	show(): void {
		this.visible.set(true);
	}

	hide(): void {
		this.visible.set(false);
	}
}
