import { FindInBoundsSchema } from './find-in-bounds.dto.js';

describe('FindInBoundsSchema', () => {
	it('should validate correct bounding box coordinates', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3',
			swLng: '2.1',
			neLat: '41.5',
			neLng: '2.3',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.swLat).toBe(41.3);
			expect(result.data.swLng).toBe(2.1);
			expect(result.data.neLat).toBe(41.5);
			expect(result.data.neLng).toBe(2.3);
		}
	});

	it('should accept optional venueType parameter', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3',
			swLng: '2.1',
			neLat: '41.5',
			neLng: '2.3',
			venueType: 'cafe,store',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.venueType).toBe('cafe,store');
		}
	});

	it('should reject latitude values below -90', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '-91',
			swLng: '2.1',
			neLat: '41.5',
			neLng: '2.3',
		});

		expect(result.success).toBe(false);
	});

	it('should reject latitude values above 90', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3',
			swLng: '2.1',
			neLat: '91',
			neLng: '2.3',
		});

		expect(result.success).toBe(false);
	});

	it('should reject longitude values below -180', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3',
			swLng: '-181',
			neLat: '41.5',
			neLng: '2.3',
		});

		expect(result.success).toBe(false);
	});

	it('should reject longitude values above 180', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3',
			swLng: '2.1',
			neLat: '41.5',
			neLng: '181',
		});

		expect(result.success).toBe(false);
	});

	it('should coerce string values to numbers', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '41.3851',
			swLng: '2.1734',
			neLat: '41.5000',
			neLng: '2.3000',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(typeof result.data.swLat).toBe('number');
			expect(typeof result.data.swLng).toBe('number');
		}
	});

	it('should accept edge case boundary values', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: '-90',
			swLng: '-180',
			neLat: '90',
			neLng: '180',
		});

		expect(result.success).toBe(true);
	});

	it('should reject non-numeric values', () => {
		const result = FindInBoundsSchema.safeParse({
			swLat: 'not-a-number',
			swLng: '2.1',
			neLat: '41.5',
			neLng: '2.3',
		});

		expect(result.success).toBe(false);
	});
});
