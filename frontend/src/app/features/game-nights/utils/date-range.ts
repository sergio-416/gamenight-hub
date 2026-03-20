export type DateRange = {
	from: string | null;
	to: string | null;
};

const FILTER_PRESETS = {
	THIS_WEEK: 'this-week',
	NEXT_7D: 'next-7d',
	NEXT_14D: 'next-14d',
	THIS_MONTH: 'this-month',
	ALL: 'all',
} as const;

export type FilterPresetKey = (typeof FILTER_PRESETS)[keyof typeof FILTER_PRESETS];

export const DEFAULT_PRESET: FilterPresetKey = FILTER_PRESETS.NEXT_14D;

export const VALID_PRESETS: ReadonlySet<string> = new Set<FilterPresetKey>([
	FILTER_PRESETS.THIS_WEEK,
	FILTER_PRESETS.NEXT_7D,
	FILTER_PRESETS.NEXT_14D,
	FILTER_PRESETS.THIS_MONTH,
	FILTER_PRESETS.ALL,
]);

function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfWeek(date: Date): Date {
	const monday = startOfWeek(date);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return sunday;
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function startOfMonth(date: Date): Date {
	const d = new Date(date);
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfMonth(date: Date): Date {
	const d = new Date(date);
	d.setMonth(d.getMonth() + 1, 0);
	d.setHours(23, 59, 59, 999);
	return d;
}

export function computeDateRange(preset: FilterPresetKey): DateRange {
	const now = new Date();

	switch (preset) {
		case FILTER_PRESETS.THIS_WEEK:
			return {
				from: startOfWeek(now).toISOString(),
				to: endOfWeek(now).toISOString(),
			};

		case FILTER_PRESETS.NEXT_7D:
			return {
				from: now.toISOString(),
				to: addDays(now, 7).toISOString(),
			};

		case FILTER_PRESETS.NEXT_14D:
			return {
				from: now.toISOString(),
				to: addDays(now, 14).toISOString(),
			};

		case FILTER_PRESETS.THIS_MONTH:
			return {
				from: startOfMonth(now).toISOString(),
				to: endOfMonth(now).toISOString(),
			};

		case FILTER_PRESETS.ALL:
			return { from: null, to: null };
	}
}

export function resolvePreset(raw: string | null | undefined): FilterPresetKey {
	if (raw != null && VALID_PRESETS.has(raw)) {
		return raw as FilterPresetKey;
	}
	return DEFAULT_PRESET;
}
