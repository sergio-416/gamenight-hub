import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/application/auth.service.js';
import { AuthController } from '../src/modules/auth/presentation/auth.controller.js';

const mockAuthUser = {
	uid: 'user-uid-123',
	email: 'test@example.com',
	emailVerified: true,
	role: 'user',
	userType: 'regular',
};

describe('Auth API (e2e)', () => {
	let app: INestApplication;

	const mockAuthService = {
		verifyToken: vi.fn().mockResolvedValue(mockAuthUser),
		extractTokenFromHeader: vi.fn(),
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
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
		mockAuthService.verifyToken.mockResolvedValue(mockAuthUser);
	});

	describe('POST /api/v1/auth/verify', () => {
		it('should return a user when token is valid', async () => {
			const res = await request(app.getHttpServer())
				.post('/api/v1/auth/verify')
				.send({ token: 'valid-firebase-token' })
				.expect(201);

			expect(res.body.uid).toBe('user-uid-123');
			expect(res.body.email).toBe('test@example.com');
			expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-firebase-token');
		});

		it('should return 401 when token is invalid', async () => {
			const { UnauthorizedException } = await import('@nestjs/common');
			mockAuthService.verifyToken.mockRejectedValue(new UnauthorizedException('Invalid token'));

			const res = await request(app.getHttpServer())
				.post('/api/v1/auth/verify')
				.send({ token: 'invalid-firebase-token' })
				.expect(401);

			expect(res.body.message).toBe('Invalid token');
		});

		it('should return 400 when token is missing', async () => {
			await request(app.getHttpServer()).post('/api/v1/auth/verify').send({}).expect(400);
		});
	});
});
