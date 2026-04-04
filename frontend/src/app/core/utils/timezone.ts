export function toISOWithOffset(date: string, time: string): string | undefined {
	if (!date || !time) return undefined;
	const local = new Date(`${date}T${time}`);
	const offsetMinutes = local.getTimezoneOffset();
	const sign = offsetMinutes <= 0 ? '+' : '-';
	const absMinutes = Math.abs(offsetMinutes);
	const hh = String(Math.floor(absMinutes / 60)).padStart(2, '0');
	const mm = String(absMinutes % 60).padStart(2, '0');
	return `${date}T${time}:00${sign}${hh}:${mm}`;
}

export function appendTimezoneOffset(datetimeLocal: string): string {
	const date = new Date(datetimeLocal);
	const offsetMinutes = date.getTimezoneOffset();
	const sign = offsetMinutes <= 0 ? '+' : '-';
	const absMinutes = Math.abs(offsetMinutes);
	const hh = String(Math.floor(absMinutes / 60)).padStart(2, '0');
	const mm = String(absMinutes % 60).padStart(2, '0');
	return `${datetimeLocal}:00${sign}${hh}:${mm}`;
}
