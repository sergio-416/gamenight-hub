import { ERROR_CODE } from '@common/error-codes';
import { EmailService } from '@modules/email/application/email.service';
import { ResendProvider } from '@modules/email/infrastructure/resend.provider';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

const mockSend = vi.fn();

const mockResendProvider = {
	getClient: vi.fn().mockReturnValue({
		emails: { send: mockSend },
	}),
};

const mockConfigService = {
	get: vi.fn((key: string) => {
		if (key === 'EMAIL_FROM') return 'noreply@gamenight.hub';
		return undefined;
	}),
};

describe('EmailService', () => {
	let service: EmailService;

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EmailService,
				{ provide: ResendProvider, useValue: mockResendProvider },
				{ provide: ConfigService, useValue: mockConfigService },
			],
		}).compile();

		service = module.get<EmailService>(EmailService);
	});

	describe('sendMagicLink', () => {
		it('should send email with correct params', async () => {
			mockSend.mockResolvedValue({ id: 'email-123' });

			await service.sendMagicLink('user@example.com', 'https://app.test/magic?token=abc');

			expect(mockSend).toHaveBeenCalledWith({
				from: 'noreply@gamenight.hub',
				to: ['user@example.com'],
				subject: 'Sign in to GameNight Hub',
				html: expect.stringContaining('https://app.test/magic?token=abc'),
			});
		});

		it('should use the from address from config', async () => {
			mockSend.mockResolvedValue({ id: 'email-456' });

			await service.sendMagicLink('test@example.com', 'https://app.test/link');

			expect(mockConfigService.get).toHaveBeenCalledWith('EMAIL_FROM');
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({ from: 'noreply@gamenight.hub' }),
			);
		});

		it('should throw InternalServerErrorException on Resend API failure', async () => {
			mockSend.mockRejectedValue(new Error('Resend API down'));

			await expect(
				service.sendMagicLink('user@example.com', 'https://app.test/link'),
			).rejects.toThrow(InternalServerErrorException);

			try {
				await service.sendMagicLink('user@example.com', 'https://app.test/link');
			} catch (err) {
				expect((err as InternalServerErrorException).getResponse()).toEqual(
					expect.objectContaining({ code: ERROR_CODE.MAGIC_LINK_FAILED }),
				);
			}
		});
	});
});
