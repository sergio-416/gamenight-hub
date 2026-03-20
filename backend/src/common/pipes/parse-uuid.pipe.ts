import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { ERROR_CODE } from '../error-codes';

const UuidSchema = z.string().uuid();

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
	transform(value: string): string {
		const result = UuidSchema.safeParse(value);
		if (!result.success) {
			throw new BadRequestException({
				code: ERROR_CODE.INVALID_UUID,
				message: 'Invalid UUID format',
			});
		}
		return result.data;
	}
}
