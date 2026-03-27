import { PAGINATION } from '@gamenight-hub/shared';
import { z } from 'zod';

export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
	limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export function paginate<T>(
	data: T[],
	total: number,
	page: number,
	limit: number,
): PaginatedResponse<T> {
	return {
		data,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	};
}
