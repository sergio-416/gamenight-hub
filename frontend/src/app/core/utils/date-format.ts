function toDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

export function formatDateMedium(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(toDate(date));
}

export function formatDateFull(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(toDate(date));
}

export function formatTime(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
	}).format(toDate(date));
}

export function formatMonthYear(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		month: 'long',
		year: 'numeric',
	}).format(toDate(date));
}

export function formatFullDate(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(toDate(date));
}

export function formatDayMonth(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		month: 'long',
		day: 'numeric',
	}).format(toDate(date));
}

export function formatShortDayTime(date: string | Date, locale: string): string {
	const d = toDate(date);
	const dayPart = new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	}).format(d);
	const timePart = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	}).format(d);
	return `${dayPart} \u2022 ${timePart}`;
}

export function formatTimeShort(date: string | Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	}).format(toDate(date));
}
