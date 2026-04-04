import { describe, expect, it } from 'vitest';
import { appendTimezoneOffset, toISOWithOffset } from './timezone';

describe('timezone utilities', () => {
	describe('toISOWithOffset', () => {
		it('should return undefined when date is empty', () => {
			expect(toISOWithOffset('', '10:00')).toBeUndefined();
		});

		it('should return undefined when time is empty', () => {
			expect(toISOWithOffset('2025-06-15', '')).toBeUndefined();
		});

		it('should return ISO string with timezone offset', () => {
			const result = toISOWithOffset('2025-06-15', '14:30');
			expect(result).toBeDefined();
			expect(result).toMatch(/^2025-06-15T14:30:00[+-]\d{2}:\d{2}$/);
		});
	});

	describe('appendTimezoneOffset', () => {
		it('should append timezone offset to datetime-local value', () => {
			const result = appendTimezoneOffset('2025-06-15T14:30');
			expect(result).toMatch(/^2025-06-15T14:30:00[+-]\d{2}:\d{2}$/);
		});
	});
});
