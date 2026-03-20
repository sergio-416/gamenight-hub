import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	effect,
	inject,
	input,
	output,
	signal,
} from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";

interface DayCell {
	date: Date;
	isCurrentMonth: boolean;
	isToday: boolean;
	isSelected: boolean;
	isPast: boolean;
	cssClass: string;
}

const DAY_BASE =
	"h-9 w-9 rounded-full text-sm flex items-center justify-center cursor-pointer transition-colors";
const DAY_SELECTED = `${DAY_BASE} bg-emerald-500 text-white hover:bg-emerald-600`;
const DAY_TODAY = `${DAY_BASE} bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30`;
const DAY_OTHER = `${DAY_BASE} text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-700`;
const DAY_NORMAL = `${DAY_BASE} text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700`;
const DAY_DISABLED = `${DAY_BASE} text-slate-200 cursor-not-allowed dark:text-slate-700`;

@Component({
	selector: "app-date-time-picker",
	templateUrl: "./date-time-picker.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "block" },
	imports: [TranslocoDirective],
})
export class DateTimePicker {
	readonly dateTimeChange = output<Date>();

	readonly label = input<string>("");
	readonly initialDate = input<Date | null>(null);
	readonly minDate = input<Date | null>(null);
	readonly required = input<boolean>(false);

	readonly monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	readonly weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

	readonly hourOptions: { value: number; label: string }[] = Array.from(
		{ length: 24 },
		(_, i) => ({
			value: i,
			label: String(i).padStart(2, "0"),
		}),
	);
	readonly minuteOptions: { value: number; label: string }[] = [
		0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
	].map((m) => ({ value: m, label: String(m).padStart(2, "0") }));

	readonly #el = inject(ElementRef);
	readonly #open = signal(false);
	readonly #viewMonth = signal(new Date().getMonth());
	readonly #viewYear = signal(new Date().getFullYear());
	readonly #selectedDate = signal<Date | null>(null);
	readonly #hour = signal(12);
	readonly #minute = signal(0);
	readonly #timeOpen = signal(false);
	readonly #initialized = signal(false);

	readonly open = this.#open.asReadonly();
	readonly viewMonth = this.#viewMonth.asReadonly();
	readonly viewYear = this.#viewYear.asReadonly();
	readonly selectedDate = this.#selectedDate.asReadonly();
	readonly selectedHour = this.#hour.asReadonly();
	readonly selectedMinute = this.#minute.asReadonly();
	readonly timeOpen = this.#timeOpen.asReadonly();

	readonly selectedTimeLabel = computed(
		() =>
			`${String(this.#hour()).padStart(2, "0")}:${String(this.#minute()).padStart(2, "0")}`,
	);

	readonly days = computed<DayCell[]>(() => {
		const month = this.#viewMonth();
		const year = this.#viewYear();
		const selected = this.#selectedDate();
		const min = this.minDate();
		const today = new Date();
		const first = new Date(year, month, 1);
		const start = new Date(first);
		start.setDate(1 - first.getDay());
		return Array.from({ length: 42 }, (_, i) => {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			const isCurrentMonth = d.getMonth() === month;
			const isToday = this.#sameDay(d, today);
			const isSelected = selected ? this.#sameDay(d, selected) : false;
			const isPast = min ? this.#beforeDay(d, min) : false;
			const cssClass = isPast
				? DAY_DISABLED
				: isSelected
					? DAY_SELECTED
					: isToday
						? DAY_TODAY
						: isCurrentMonth
							? DAY_NORMAL
							: DAY_OTHER;
			return { date: d, isCurrentMonth, isToday, isSelected, isPast, cssClass };
		});
	});

	readonly displayValue = computed(() => {
		const d = this.#selectedDate();
		if (!d) return null;
		const combined = new Date(
			d.getFullYear(),
			d.getMonth(),
			d.getDate(),
			this.#hour(),
			this.#minute(),
		);
		return new Intl.DateTimeFormat("en", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}).format(combined);
	});

	constructor() {
		effect((onCleanup) => {
			if (!this.#open()) return;
			const handler = (e: MouseEvent) => {
				if (!this.#el.nativeElement.contains(e.target)) {
					this.#open.set(false);
					this.#timeOpen.set(false);
				}
			};
			document.addEventListener("click", handler, true);
			onCleanup(() => document.removeEventListener("click", handler, true));
		});

		effect(() => {
			const d = this.initialDate();
			if (d && !this.#initialized()) {
				this.#initialized.set(true);
				this.#selectedDate.set(d);
				this.#viewMonth.set(d.getMonth());
				this.#viewYear.set(d.getFullYear());
				this.#hour.set(d.getHours());
				this.#minute.set(d.getMinutes());
			}
		});
	}

	toggleOpen(): void {
		this.#timeOpen.set(false);
		this.#open.update((v) => !v);
	}

	prevMonth(): void {
		if (this.#viewMonth() === 0) {
			this.#viewMonth.set(11);
			this.#viewYear.update((y) => y - 1);
		} else {
			this.#viewMonth.update((m) => m - 1);
		}
	}

	nextMonth(): void {
		if (this.#viewMonth() === 11) {
			this.#viewMonth.set(0);
			this.#viewYear.update((y) => y + 1);
		} else {
			this.#viewMonth.update((m) => m + 1);
		}
	}

	selectDay(cell: DayCell): void {
		if (cell.isPast) return;
		this.#selectedDate.set(cell.date);
		this.#viewMonth.set(cell.date.getMonth());
		this.#viewYear.set(cell.date.getFullYear());
		this.#timeOpen.set(false);
		this.#emit();
	}

	closeTime(): void {
		this.#timeOpen.set(false);
	}

	toggleTimeDropdown(e: Event): void {
		e.stopPropagation();
		this.#timeOpen.update((v) => !v);
	}

	selectHour(h: number, e: Event): void {
		e.stopPropagation();
		this.#hour.set(h);
		this.#emit();
	}

	selectMinute(m: number, e: Event): void {
		e.stopPropagation();
		this.#minute.set(m);
		this.#timeOpen.set(false);
		if (this.#selectedDate()) {
			this.#open.set(false);
		}
		this.#emit();
	}

	#sameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	#beforeDay(a: Date, b: Date): boolean {
		const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
		const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
		return aDate.getTime() < bDate.getTime();
	}

	#emit(): void {
		const d = this.#selectedDate();
		if (!d) return;
		const result = new Date(
			d.getFullYear(),
			d.getMonth(),
			d.getDate(),
			this.#hour(),
			this.#minute(),
			0,
			0,
		);
		if (result.getFullYear() > 9999 || result.getFullYear() < 1900) return;
		this.dateTimeChange.emit(result);
	}
}
