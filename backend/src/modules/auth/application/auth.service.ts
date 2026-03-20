import type { AuthUser } from '@auth/domain/interfaces/auth-user.interface';
import { FirebaseAdminProvider } from '@auth/infrastructure/firebase/firebase-admin.provider';
import { ERROR_CODE } from '@common/error-codes';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
	readonly #logger = new Logger(AuthService.name);
	readonly #firebaseAdmin: FirebaseAdminProvider;
	readonly #configService: ConfigService;

	constructor(
		@Inject(FirebaseAdminProvider) firebaseAdmin: FirebaseAdminProvider,
		@Inject(ConfigService) configService: ConfigService,
	) {
		this.#firebaseAdmin = firebaseAdmin;
		this.#configService = configService;
	}

	async generateMagicLink(email: string): Promise<string> {
		const frontendUrl = this.#configService.get<string>('FRONTEND_URL')!;

		try {
			return await this.#firebaseAdmin.getAuth().generateSignInWithEmailLink(email, {
				url: `${frontendUrl}/auth/callback`,
				handleCodeInApp: true,
			});
		} catch (err) {
			this.#logger.error(`Magic link generation failed for ${email}: ${err}`);
			throw err;
		}
	}

	async verifyToken(token: string): Promise<AuthUser> {
		if (!token || token.trim() === '') {
			throw new UnauthorizedException({
				code: ERROR_CODE.NO_TOKEN_PROVIDED,
				message: 'No token provided',
			});
		}

		try {
			const decoded = await this.#firebaseAdmin.getAuth().verifyIdToken(token);

			return {
				uid: decoded.uid,
				email: decoded.email || '',
				emailVerified: decoded.email_verified ?? false,
				role: decoded.role ?? 'user',
				userType: decoded.userType ?? 'regular',
			};
		} catch (error) {
			this.#logger.error('Token verification failed', error);
			throw new UnauthorizedException({
				code: ERROR_CODE.INVALID_TOKEN,
				message: 'Invalid token',
			});
		}
	}

	extractTokenFromHeader(authHeader: string): string | null {
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return null;
		}

		return authHeader.substring(7);
	}
}
