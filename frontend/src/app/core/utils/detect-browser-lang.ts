export function detectBrowserLang(
	supported: readonly string[],
	fallback: string,
): string {
	const browserLangs =
		typeof navigator !== 'undefined'
			? navigator.languages?.length
				? navigator.languages
				: navigator.language
					? [navigator.language]
					: []
			: [];

	for (const browserLang of browserLangs) {
		const lower = browserLang.toLowerCase();

		if (supported.includes(lower)) {
			return lower;
		}

		const prefix = lower.split('-')[0];
		if (supported.includes(prefix)) {
			return prefix;
		}
	}

	return fallback;
}
