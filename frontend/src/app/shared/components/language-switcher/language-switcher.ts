import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	HostListener,
	inject,
	signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

const LANG_LABELS = {
	en: { code: 'EN', native: 'English' },
	es: { code: 'ES', native: 'Español' },
	ca: { code: 'CA', native: 'Català' },
	fr: { code: 'FR', native: 'Français' },
	de: { code: 'DE', native: 'Deutsch' },
	pt: { code: 'PT', native: 'Português' },
	it: { code: 'IT', native: 'Italiano' },
} as const;

type LangCode = keyof typeof LANG_LABELS;

const STORAGE_KEY = 'transloco-lang';

@Component({
	selector: 'app-language-switcher',
	host: { class: 'relative block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslocoDirective],
	template: `
		<div *transloco="let t">
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
				[attr.aria-haspopup]="'listbox'"
				[attr.aria-expanded]="open()"
				[attr.aria-label]="
					t('languageSwitcher.switchTo', { lang: activeLangLabel() })
				"
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
						d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
					/>
				</svg>
				<span class="text-xs font-semibold tracking-wide">{{
					activeLangCode()
				}}</span>
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
					[attr.aria-label]="t('languageSwitcher.label')"
					class="absolute right-0 top-full z-50 mt-1.5 min-w-44 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-black/10 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20"
				>
					@for (lang of langs(); track lang) {
						<li
							role="option"
							[attr.aria-selected]="lang === activeLang()"
							class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150"
							[class.text-emerald-400]="lang === activeLang()"
							[class.font-medium]="lang === activeLang()"
							[class.bg-emerald-500/10]="lang === activeLang()"
							[class.text-slate-600]="lang !== activeLang()"
							[class.hover:bg-slate-100]="lang !== activeLang()"
							[class.dark:hover:bg-slate-700]="lang !== activeLang()"
							(click)="selectLang(lang)"
						>
							<span>{{ nativeName(lang) }}</span>
							@if (lang === activeLang()) {
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
export class LanguageSwitcher {
	readonly #transloco = inject(TranslocoService);
	readonly #elRef = inject(ElementRef);

	readonly #langChanges = toSignal(this.#transloco.langChanges$, {
		initialValue: this.#transloco.getActiveLang(),
	});

	readonly activeLang = computed(() => this.#langChanges());
	readonly activeLangCode = computed(
		() => LANG_LABELS[this.activeLang() as LangCode]?.code ?? this.activeLang().toUpperCase(),
	);
	readonly activeLangLabel = computed(
		() => LANG_LABELS[this.activeLang() as LangCode]?.native ?? this.activeLang(),
	);
	readonly langs = signal(this.#transloco.getAvailableLangs() as string[]);
	readonly open = signal(false);

	nativeName(lang: string): string {
		return LANG_LABELS[lang as LangCode]?.native ?? lang;
	}

	toggle(): void {
		this.open.update((v) => !v);
	}

	selectLang(lang: string): void {
		this.#transloco.setActiveLang(lang);
		localStorage.setItem(STORAGE_KEY, lang);
		this.open.set(false);
	}

	@HostListener('document:click', ['$event.target'])
	onClickOutside(target: EventTarget | null): void {
		if (this.open() && !this.#elRef.nativeElement.contains(target as Node)) {
			this.open.set(false);
		}
	}

	@HostListener('document:keydown.escape')
	onEscape(): void {
		if (this.open()) {
			this.open.set(false);
		}
	}
}
