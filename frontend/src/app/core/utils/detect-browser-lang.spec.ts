import { detectBrowserLang } from './detect-browser-lang';

const SUPPORTED = ['en', 'es', 'ca', 'fr', 'de', 'pt', 'it'] as const;

describe('detectBrowserLang', () => {
	let originalLanguages: PropertyDescriptor | undefined;
	let originalLanguage: PropertyDescriptor | undefined;

	beforeEach(() => {
		originalLanguages = Object.getOwnPropertyDescriptor(navigator, 'languages');
		originalLanguage = Object.getOwnPropertyDescriptor(navigator, 'language');
	});

	afterEach(() => {
		if (originalLanguages) {
			Object.defineProperty(navigator, 'languages', originalLanguages);
		} else {
			Object.defineProperty(navigator, 'languages', {
				value: [],
				configurable: true,
			});
		}
		if (originalLanguage) {
			Object.defineProperty(navigator, 'language', originalLanguage);
		}
	});

	function mockLanguages(languages: string[]): void {
		Object.defineProperty(navigator, 'languages', {
			value: languages,
			configurable: true,
		});
	}

	it('should return exact match for supported language', () => {
		mockLanguages(['fr']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('fr');
	});

	it('should return prefix match for de-DE', () => {
		mockLanguages(['de-DE']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('de');
	});

	it('should return prefix match for pt-BR', () => {
		mockLanguages(['pt-BR']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('pt');
	});

	it('should return prefix match for es-419', () => {
		mockLanguages(['es-419']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('es');
	});

	it('should return prefix match for fr-CA', () => {
		mockLanguages(['fr-CA']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('fr');
	});

	it('should return fallback when no match', () => {
		mockLanguages(['ja', 'ko']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('en');
	});

	it('should return fallback for empty languages', () => {
		mockLanguages([]);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('en');
	});

	it('should prefer first matching language in priority order', () => {
		mockLanguages(['ja', 'it-IT', 'fr']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('it');
	});

	it('should be case-insensitive', () => {
		mockLanguages(['DE-DE']);
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('de');
	});

	it('should fall back to navigator.language when languages is empty', () => {
		Object.defineProperty(navigator, 'languages', {
			value: [],
			configurable: true,
		});
		Object.defineProperty(navigator, 'language', {
			value: 'it',
			configurable: true,
		});
		expect(detectBrowserLang(SUPPORTED, 'en')).toBe('it');
	});
});
