import { AuthService } from '@auth/application/auth.service';
import { AuthController } from '@auth/presentation/auth.controller';
import { EmailService } from '@modules/email/application/email.service';
import { Test, type TestingModule } from '@nestjs/testing';

const mockGenerateMagicLink = vi.fn();
const mockSendMagicLink = vi.fn();

const mockAuthService = { generateMagicLink: mockGenerateMagicLink };
const mockEmailService = { sendMagicLink: mockSendMagicLink };

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: EmailService, useValue: mockEmailService },
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	describe('POST /magic-link', () => {
		const validBody = { email: 'user@example.com' };

		it('should return 202 with success message on valid email', async () => {
			mockGenerateMagicLink.mockResolvedValue('https://magic.link/abc');
			mockSendMagicLink.mockResolvedValue(undefined);

			const result = await controller.requestMagicLink(validBody);

			expect(result).toEqual({
				message: 'If this email is registered, a sign-in link has been sent.',
			});
		});

		it('should call generateMagicLink then sendMagicLink', async () => {
			mockGenerateMagicLink.mockResolvedValue('https://magic.link/abc');
			mockSendMagicLink.mockResolvedValue(undefined);

			await controller.requestMagicLink(validBody);

			expect(mockGenerateMagicLink).toHaveBeenCalledWith('user@example.com');
			expect(mockSendMagicLink).toHaveBeenCalledWith('user@example.com', 'https://magic.link/abc');
		});

		it('should return 202 even when generateMagicLink throws', async () => {
			mockGenerateMagicLink.mockRejectedValue(new Error('Firebase error'));

			const result = await controller.requestMagicLink(validBody);

			expect(result).toEqual({
				message: 'If this email is registered, a sign-in link has been sent.',
			});
			expect(mockSendMagicLink).not.toHaveBeenCalled();
		});

		it('should return 202 even when sendMagicLink throws', async () => {
			mockGenerateMagicLink.mockResolvedValue('https://magic.link/abc');
			mockSendMagicLink.mockRejectedValue(new Error('Resend error'));

			const result = await controller.requestMagicLink(validBody);

			expect(result).toEqual({
				message: 'If this email is registered, a sign-in link has been sent.',
			});
		});
	});
});
