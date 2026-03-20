import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	HostListener,
	inject,
	signal,
} from "@angular/core";
import { type CvdMode, ThemeService } from "@core/services/theme.service";
import { TranslocoDirective } from "@jsverse/transloco";

const CVD_OPTIONS: { value: CvdMode; labelKey: string }[] = [
	{ value: "none", labelKey: "cvdSelector.normal" },
	{ value: "protanopia", labelKey: "cvdSelector.protanopia" },
	{ value: "deuteranopia", labelKey: "cvdSelector.deuteranopia" },
	{ value: "tritanopia", labelKey: "cvdSelector.tritanopia" },
];

@Component({
	selector: "app-cvd-selector",
	host: { class: "relative block" },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslocoDirective],
	template: `
		<div *transloco="let t">
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
				[attr.aria-haspopup]="'listbox'"
				[attr.aria-expanded]="open()"
				[attr.aria-label]="t('cvdSelector.label')"
				(click)="toggle()"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-5 w-5"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
					/>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-3 w-3 transition-transform duration-200"
					[class.rotate-180]="open()"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			@if (open()) {
				<ul
					role="listbox"
					[attr.aria-label]="t('cvdSelector.label')"
					class="absolute right-0 top-full z-50 mt-1.5 min-w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-black/10 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20"
				>
					@for (option of options; track option.value) {
						<li
							role="option"
							[attr.aria-selected]="option.value === activeCvdMode()"
							class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150"
							[class.text-emerald-400]="option.value === activeCvdMode()"
							[class.font-medium]="option.value === activeCvdMode()"
							[class.bg-emerald-500/10]="option.value === activeCvdMode()"
							[class.text-slate-600]="option.value !== activeCvdMode()"
							[class.hover:bg-slate-100]="option.value !== activeCvdMode()"
							[class.dark:hover:bg-slate-700]="option.value !== activeCvdMode()"
							(click)="selectMode(option.value)"
						>
							<span>{{ t(option.labelKey) }}</span>
							@if (option.value === activeCvdMode()) {
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									class="h-4 w-4 text-emerald-400"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
										clip-rule="evenodd"
									/>
								</svg>
							}
						</li>
					}
				</ul>
			}
		</div>
	`,
})
export class CvdSelector {
	readonly #themeService = inject(ThemeService);
	readonly #elRef = inject(ElementRef);

	readonly options = CVD_OPTIONS;
	readonly activeCvdMode = this.#themeService.cvdMode;
	readonly open = signal(false);

	toggle(): void {
		this.open.update((v) => !v);
	}

	selectMode(mode: CvdMode): void {
		this.#themeService.setCvdMode(mode);
		this.open.set(false);
	}

	@HostListener("document:click", ["$event.target"])
	onClickOutside(target: EventTarget | null): void {
		if (this.open() && !this.#elRef.nativeElement.contains(target as Node)) {
			this.open.set(false);
		}
	}

	@HostListener("document:keydown.escape")
	onEscape(): void {
		if (this.open()) {
			this.open.set(false);
		}
	}
}
