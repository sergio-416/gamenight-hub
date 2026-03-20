import type { AuthRequest } from '@auth/domain/types/auth-request.type';
import { ModeratorGuard } from '@auth/infrastructure/guards/moderator.guard';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';

const makeContext = (role: string): ExecutionContext =>
	({
		switchToHttp: () => ({
			getRequest: () =>
				({
					user: { uid: 'uid-1', email: 'u@e.com', role, userType: 'regular' },
				}) as AuthRequest,
		}),
	}) as unknown as ExecutionContext;

describe('ModeratorGuard', () => {
	let guard: ModeratorGuard;

	beforeEach(() => {
		guard = new ModeratorGuard();
	});

	it('should allow admin users', async () => {
		await expect(guard.canActivate(makeContext('admin'))).resolves.toBe(true);
	});

	it('should allow moderator users', async () => {
		await expect(guard.canActivate(makeContext('moderator'))).resolves.toBe(true);
	});

	it('should throw ForbiddenException for regular users', async () => {
		await expect(guard.canActivate(makeContext('user'))).rejects.toThrow(ForbiddenException);
	});

	it('should throw ForbiddenException for store organisers with user role', async () => {
		await expect(guard.canActivate(makeContext('user'))).rejects.toThrow(ForbiddenException);
	});
});
