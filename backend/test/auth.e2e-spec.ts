import { type INestApplication, VersioningType } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/application/auth.service.js';
import { AuthController } from '../src/modules/auth/presentation/auth.controller.js';
import { EmailService } from '../src/modules/email/application/email.service.js';

describe('Auth API (e2e)', () => {
	let app: INestApplication;

	const mockAuthService = {
		generateMagicLink: vi.fn().mockResolvedValue('https://magic-link.test/abc123'),
		verifyToken: vi.fn(),
		extractTokenFromHeader: vi.fn(),
	};

	const mockEmailService = {
		sendMagicLink: vi.fn().mockResolvedValue(undefined),
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: EmailService, useValue: mockEmailService },
				{ provide: APP_GUARD, useClass: ThrottlerGuard },
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix('api');
		app.enableVersioning({ type: VersioningType.URI });
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockAuthService.generateMagicLink.mockResolvedValue('https://magic-link.test/abc123');
		mockEmailService.sendMagicLink.mockResolvedValue(undefined);
	});

	describe('POST /api/v1/auth/magic-link', () => {
		it('should return 202 when email is valid', async () => {
			const res = await request(app.getHttpServer())
				.post('/api/v1/auth/magic-link')
				.send({ email: 'test@example.com' })
				.expect(202);

			expect(res.body.message).toBe('If this email is registered, a sign-in link has been sent.');
			expect(mockAuthService.generateMagicLink).toHaveBeenCalledWith('test@example.com');
			expect(mockEmailService.sendMagicLink).toHaveBeenCalledWith(
				'test@example.com',
				'https://magic-link.test/abc123',
			);
		});

		it('should still return 202 when magic link generation fails', async () => {
			mockAuthService.generateMagicLink.mockRejectedValue(new Error('Firebase error'));

			const res = await request(app.getHttpServer())
				.post('/api/v1/auth/magic-link')
				.send({ email: 'fail@example.com' })
				.expect(202);

			expect(res.body.message).toBe('If this email is registered, a sign-in link has been sent.');
		});

		it('should return 400 when email is missing', async () => {
			await request(app.getHttpServer()).post('/api/v1/auth/magic-link').send({}).expect(400);
		});

		it('should return 400 when email is invalid', async () => {
			await request(app.getHttpServer())
				.post('/api/v1/auth/magic-link')
				.send({ email: 'not-an-email' })
				.expect(400);
		});
	});
});
