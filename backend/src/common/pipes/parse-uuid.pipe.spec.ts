import { BadRequestException } from '@nestjs/common';
import { ParseUuidPipe } from './parse-uuid.pipe';

describe('ParseUuidPipe', () => {
	const pipe = new ParseUuidPipe();

	it('should accept a valid UUID v4', () => {
		const uuid = '507f1f77-bcf8-6cd7-9943-9033aaaabbbb';
		expect(pipe.transform(uuid)).toBe(uuid);
	});

	it('should reject an invalid UUID', () => {
		expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException);
	});

	it('should reject an empty string', () => {
		expect(() => pipe.transform('')).toThrow(BadRequestException);
	});

	it('should reject a numeric string', () => {
		expect(() => pipe.transform('12345')).toThrow(BadRequestException);
	});
});
