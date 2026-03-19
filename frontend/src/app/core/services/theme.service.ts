import {
	Injectable,
	signal,
	computed,
	effect,
	PLATFORM_ID,
	inject,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

export type Theme = "light" | "dark" | "system";

const CVD_MODES = {
	NONE: "none",
	PROTANOPIA: "protanopia",
	DEUTERANOPIA: "deuteranopia",
	TRITANOPIA: "tritanopia",
} as const;

export type CvdMode = (typeof CVD_MODES)[keyof typeof CVD_MODES];

const STORAGE_KEY = "gnh-theme";
const CVD_STORAGE_KEY = "gnh-cvd-mode";

@Injectable({ providedIn: "root" })
export class ThemeService {
	readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	readonly theme = signal<Theme>(this.#loadSaved());
	readonly #systemPrefersDark = signal(this.#getSystemPreference());
	readonly cvdMode = signal<CvdMode>(this.#loadSavedCvd());
	readonly CVD_MODES = Object.values(CVD_MODES);

	readonly isDark = computed(() => {
		const t = this.theme();
		return t === "dark" || (t === "system" && this.#systemPrefersDark());
	});

	constructor() {
		if (this.#isBrowser) {
			const mq = window.matchMedia("(prefers-color-scheme: dark)");
			mq.addEventListener("change", (e) =>
				this.#systemPrefersDark.set(e.matches),
			);
		}

		effect(() => {
			const dark = this.isDark();
			if (!this.#isBrowser) return;
			document.documentElement.classList.toggle("dark", dark);
		});

		effect(() => {
			const t = this.theme();
			if (!this.#isBrowser) return;
			localStorage.setItem(STORAGE_KEY, t);
		});

		effect(() => {
			const mode = this.cvdMode();
			if (!this.#isBrowser) return;
			const cl = document.documentElement.classList;
			cl.forEach((c) => {
				if (c.startsWith("cvd-")) cl.remove(c);
			});
			if (mode !== "none") cl.add(`cvd-${mode}`);
			localStorage.setItem(CVD_STORAGE_KEY, mode);
		});
	}

	toggle(): void {
		this.theme.update((t) =>
			t === "dark" || (t === "system" && this.#systemPrefersDark())
				? "light"
				: "dark",
		);
	}

	setTheme(t: Theme): void {
		this.theme.set(t);
	}

	setCvdMode(mode: CvdMode): void {
		this.cvdMode.set(mode);
	}

	#loadSaved(): Theme {
		if (!this.#isBrowser) return "system";
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark" || saved === "system")
			return saved;
		return "system";
	}

	#loadSavedCvd(): CvdMode {
		if (!this.#isBrowser) return "none";
		const saved = localStorage.getItem(CVD_STORAGE_KEY);
		if (saved && (Object.values(CVD_MODES) as string[]).includes(saved))
			return saved as CvdMode;
		return "none";
	}

	#getSystemPreference(): boolean {
		if (!this.#isBrowser) return false;
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	}
}
