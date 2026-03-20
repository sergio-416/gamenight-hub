import type { AuthService } from '@auth/application/auth.service';
import type { AuthUser } from '@auth/domain/interfaces/auth-user.interface';
import type { AuthRequest } from '@auth/domain/types/auth-request.type';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

describe('FirebaseAuthGuard', () => {
	let guard: FirebaseAuthGuard;

	const mockAuthService = {
		extractTokenFromHeader: vi.fn(),
		verifyToken: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		guard = new FirebaseAuthGuard(mockAuthService as unknown as AuthService);
	});

	const createMockContext = (authHeader?: string): ExecutionContext => {
		const mockRequest: AuthRequest = {
			headers: authHeader ? { authorization: authHeader } : {},
		} as AuthRequest;

		return {
			switchToHttp: () => ({
				getRequest: () => mockRequest,
			}),
		} as unknown as ExecutionContext;
	};

	describe('canActivate', () => {
		it('should return true when valid token provided', async () => {
			const context = createMockContext('Bearer valid-token');
			const decodedUser: AuthUser = {
				uid: 'user-123',
				email: 'test@test.com',
				emailVerified: true,
				role: 'user',
				userType: 'regular',
			};

			mockAuthService.extractTokenFromHeader.mockReturnValue('valid-token');
			mockAuthService.verifyToken.mockResolvedValue(decodedUser);

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(mockAuthService.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
			expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
		});

		it('should attach decoded user to request when token valid', async () => {
			const context = createMockContext('Bearer valid-token');
			const decodedUser: AuthUser = {
				uid: 'user-123',
				email: 'test@test.com',
				emailVerified: true,
				role: 'user',
				userType: 'regular',
			};

			mockAuthService.extractTokenFromHeader.mockReturnValue('valid-token');
			mockAuthService.verifyToken.mockResolvedValue(decodedUser);

			await guard.canActivate(context);

			const request = context.switchToHttp().getRequest<AuthRequest>();
			expect(request.user).toEqual(decodedUser);
		});

		it('should throw UnauthorizedException when no authorization header', async () => {
			const context = createMockContext();

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException when no token in header', async () => {
			const context = createMockContext('Bearer ');

			mockAuthService.extractTokenFromHeader.mockReturnValue(null);

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException when token is invalid', async () => {
			const context = createMockContext('Bearer invalid-token');

			mockAuthService.extractTokenFromHeader.mockReturnValue('invalid-token');
			mockAuthService.verifyToken.mockRejectedValue(new UnauthorizedException());

			await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
		});
	});
});
