import { describe, expect, it } from 'vitest';
import {
	formatDateFull,
	formatDateMedium,
	formatDayMonth,
	formatFullDate,
	formatMonthYear,
	formatShortDayTime,
	formatTime,
	formatTimeShort,
} from './date-format';

describe('date-format utilities', () => {
	const testDate = new Date('2025-06-15T14:30:00');

	describe('formatDateMedium', () => {
		it('should format a Date object', () => {
			const result = formatDateMedium(testDate, 'en-US');
			expect(result).toContain('Jun');
			expect(result).toContain('15');
			expect(result).toContain('2025');
		});

		it('should format a string date', () => {
			const result = formatDateMedium('2025-06-15T14:30:00', 'en-US');
			expect(result).toContain('Jun');
			expect(result).toContain('15');
		});

		it('should respect locale', () => {
			const result = formatDateMedium(testDate, 'es');
			expect(result).toContain('jun');
		});
	});

	describe('formatDateFull', () => {
		it('should include weekday and full month', () => {
			const result = formatDateFull(testDate, 'en-US');
			expect(result).toContain('Sunday');
			expect(result).toContain('June');
			expect(result).toContain('15');
			expect(result).toContain('2025');
		});
	});

	describe('formatTime', () => {
		it('should format time', () => {
			const result = formatTime(testDate, 'en-US');
			expect(result).toMatch(/2:30/);
		});
	});

	describe('formatMonthYear', () => {
		it('should format month and year', () => {
			const result = formatMonthYear(testDate, 'en-US');
			expect(result).toContain('June');
			expect(result).toContain('2025');
		});
	});

	describe('formatFullDate', () => {
		it('should format day, month, and year', () => {
			const result = formatFullDate(testDate, 'en-GB');
			expect(result).toContain('15');
			expect(result).toContain('June');
			expect(result).toContain('2025');
		});
	});

	describe('formatDayMonth', () => {
		it('should format month and day', () => {
			const result = formatDayMonth(testDate, 'en-US');
			expect(result).toContain('June');
			expect(result).toContain('15');
		});
	});

	describe('formatShortDayTime', () => {
		it('should combine short day and time with bullet separator', () => {
			const result = formatShortDayTime(testDate, 'en-US');
			expect(result).toContain('\u2022');
			expect(result).toContain('Sun');
		});
	});

	describe('formatTimeShort', () => {
		it('should format time with hour12', () => {
			const result = formatTimeShort(testDate, 'en-US');
			expect(result).toMatch(/2:30\s*PM/i);
		});
	});
});
