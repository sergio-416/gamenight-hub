import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove('dark');
		document.documentElement.classList.forEach((c) => {
			if (c.startsWith('cvd-')) document.documentElement.classList.remove(c);
		});
	});

	function createService(): ThemeService {
		TestBed.configureTestingModule({
			providers: [ThemeService],
		});
		return TestBed.inject(ThemeService);
	}

	it('starts with system theme when no localStorage value', () => {
		const service = createService();
		expect(service.theme()).toBe('system');
	});

	it('loads saved theme from localStorage', () => {
		localStorage.setItem('gnh-theme', 'dark');
		const service = createService();
		expect(service.theme()).toBe('dark');
	});

	it('toggle switches from light to dark', () => {
		localStorage.setItem('gnh-theme', 'light');
		const service = createService();
		expect(service.theme()).toBe('light');

		service.toggle();

		expect(service.theme()).toBe('dark');
	});

	it('toggle switches from dark to light', () => {
		localStorage.setItem('gnh-theme', 'dark');
		const service = createService();
		expect(service.theme()).toBe('dark');

		service.toggle();

		expect(service.theme()).toBe('light');
	});

	it('isDark returns true when theme is dark', () => {
		localStorage.setItem('gnh-theme', 'dark');
		const service = createService();
		expect(service.isDark()).toBe(true);
	});

	it('isDark returns false when theme is light', () => {
		localStorage.setItem('gnh-theme', 'light');
		const service = createService();
		expect(service.isDark()).toBe(false);
	});

	it('persists theme choice to localStorage', () => {
		const service = createService();
		service.setTheme('dark');
		TestBed.flushEffects();
		expect(localStorage.getItem('gnh-theme')).toBe('dark');
	});

	it('applies dark class to document.documentElement when dark', () => {
		localStorage.setItem('gnh-theme', 'dark');
		createService();
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('removes dark class when switching to light', () => {
		localStorage.setItem('gnh-theme', 'dark');
		const service = createService();
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		service.setTheme('light');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('cvdMode defaults to none when no localStorage', () => {
		const service = createService();
		expect(service.cvdMode()).toBe('none');
	});

	it('setCvdMode protanopia applies cvd-protanopia class to documentElement', () => {
		const service = createService();
		service.setCvdMode('protanopia');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('cvd-protanopia')).toBe(true);
	});

	it('setCvdMode deuteranopia removes previous cvd class and applies new one', () => {
		const service = createService();
		service.setCvdMode('protanopia');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('cvd-protanopia')).toBe(true);

		service.setCvdMode('deuteranopia');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('cvd-protanopia')).toBe(false);
		expect(document.documentElement.classList.contains('cvd-deuteranopia')).toBe(true);
	});

	it('setCvdMode none removes all cvd classes', () => {
		const service = createService();
		service.setCvdMode('tritanopia');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('cvd-tritanopia')).toBe(true);

		service.setCvdMode('none');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('cvd-tritanopia')).toBe(false);
	});

	it('cvdMode persists to localStorage', () => {
		const service = createService();
		service.setCvdMode('protanopia');
		TestBed.flushEffects();
		expect(localStorage.getItem('gnh-cvd-mode')).toBe('protanopia');
	});

	it('cvdMode loads saved value from localStorage', () => {
		localStorage.setItem('gnh-cvd-mode', 'deuteranopia');
		const service = createService();
		expect(service.cvdMode()).toBe('deuteranopia');
	});

	it('invalid localStorage cvd value falls back to none', () => {
		localStorage.setItem('gnh-cvd-mode', 'invalid-value');
		const service = createService();
		expect(service.cvdMode()).toBe('none');
	});

	it('cvd class and dark class coexist independently', () => {
		localStorage.setItem('gnh-theme', 'dark');
		const service = createService();
		service.setCvdMode('protanopia');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(document.documentElement.classList.contains('cvd-protanopia')).toBe(true);

		service.setTheme('light');
		TestBed.flushEffects();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.documentElement.classList.contains('cvd-protanopia')).toBe(true);
	});
});
