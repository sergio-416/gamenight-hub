import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { AuthCallback } from './auth-callback';

const mockAuthService = {
	completeSignInWithLink: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

async function renderCallback() {
	const result = await render(AuthCallback, {
		providers: [
			provideRouter([]),
			provideTranslocoTesting(),
			{ provide: AuthService, useValue: mockAuthService },
		],
	});
	const router = result.fixture.debugElement.injector.get(Router);
	const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
	return { ...result, navigateSpy };
}

describe('AuthCallback', () => {
	it('should show a loading spinner while processing the link', async () => {
		localStorage.setItem('emailForSignIn', 'user@example.com');
		mockAuthService.completeSignInWithLink.mockReturnValue(new Promise(() => {}));

		await renderCallback();

		expect(screen.getByRole('status')).toBeTruthy();
	});

	it('should navigate to profile setup for a new user', async () => {
		localStorage.setItem('emailForSignIn', 'new@example.com');
		let resolveSignIn!: (v: { isNewUser: boolean }) => void;
		mockAuthService.completeSignInWithLink.mockReturnValue(
			new Promise<{ isNewUser: boolean }>((resolve) => {
				resolveSignIn = resolve;
			}),
		);

		const { fixture, navigateSpy } = await renderCallback();
		resolveSignIn({ isNewUser: true });
		await fixture.whenStable();

		expect(navigateSpy).toHaveBeenCalledWith(['/profile/setup']);
		expect(localStorage.getItem('emailForSignIn')).toBeNull();
	});

	it('should navigate to home for a returning user', async () => {
		localStorage.setItem('emailForSignIn', 'returning@example.com');
		let resolveSignIn!: (v: { isNewUser: boolean }) => void;
		mockAuthService.completeSignInWithLink.mockReturnValue(
			new Promise<{ isNewUser: boolean }>((resolve) => {
				resolveSignIn = resolve;
			}),
		);

		const { fixture, navigateSpy } = await renderCallback();
		resolveSignIn({ isNewUser: false });
		await fixture.whenStable();

		expect(navigateSpy).toHaveBeenCalledWith(['/home']);
		expect(localStorage.getItem('emailForSignIn')).toBeNull();
	});

	it('should show an expired error when the link is invalid', async () => {
		localStorage.setItem('emailForSignIn', 'user@example.com');
		let rejectSignIn!: (e: Error) => void;
		mockAuthService.completeSignInWithLink.mockReturnValue(
			new Promise<never>((_, reject) => {
				rejectSignIn = reject;
			}),
		);

		const { fixture } = await renderCallback();
		rejectSignIn(new Error('auth/expired-action-code'));
		await fixture.whenStable();

		expect(await screen.findByText(/expired/i)).toBeTruthy();
		expect(screen.getByRole('link', { name: /back to login/i })).toBeTruthy();
	});

	it('should show an already-used error for an invalid-action-code', async () => {
		localStorage.setItem('emailForSignIn', 'user@example.com');
		let rejectSignIn!: (e: Error) => void;
		mockAuthService.completeSignInWithLink.mockReturnValue(
			new Promise<never>((_, reject) => {
				rejectSignIn = reject;
			}),
		);

		const { fixture } = await renderCallback();
		rejectSignIn(new Error('auth/invalid-action-code'));
		await fixture.whenStable();

		expect(await screen.findByText(/already been used/i)).toBeTruthy();
	});

	it('should show the email prompt when no email is in localStorage', async () => {
		mockAuthService.completeSignInWithLink.mockReturnValue(new Promise(() => {}));

		await renderCallback();

		expect(screen.getByRole('textbox', { name: /email/i })).toBeTruthy();
	});
});
