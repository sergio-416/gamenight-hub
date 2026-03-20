import { UpdatePersonalFieldsSchema } from './update-personal-fields.dto';

describe('UpdatePersonalFieldsSchema', () => {
	describe('when updating personal fields', () => {
		it('should accept valid update with status field only', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({ status: 'owned' });
			expect(result.success).toBe(true);
		});

		it('should accept valid update with notes field only', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({
				notes: 'Great game for parties!',
			});
			expect(result.success).toBe(true);
		});

		it('should accept valid update with all fields', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({
				status: 'owned',
				notes: 'Amazing strategy game!',
				complexity: 4,
			});
			expect(result.success).toBe(true);
		});

		it('should accept empty update (all fields optional)', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({});
			expect(result.success).toBe(true);
		});
	});

	describe('when validation fails', () => {
		it('should reject status field that is not a valid status value', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({ status: 12345 });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true);
			}
		});

		it('should reject notes field that is not a string', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({ notes: 123 });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('notes'))).toBe(true);
			}
		});

		it('should reject complexity less than 1', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({ complexity: 0 });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('complexity'))).toBe(true);
			}
		});

		it('should reject complexity greater than 5', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({ complexity: 6 });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('complexity'))).toBe(true);
			}
		});

		it('should reject complexity that is not a number', () => {
			const result = UpdatePersonalFieldsSchema.safeParse({
				complexity: 'high',
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('complexity'))).toBe(true);
			}
		});
	});
});
