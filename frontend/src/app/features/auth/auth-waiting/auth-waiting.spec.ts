import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { AuthWaiting } from './auth-waiting';

const mockCurrentUser = signal<unknown>(null);

const mockAuthService = {
	currentUser: mockCurrentUser,
};

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	mockCurrentUser.set(null);
});

async function renderWaiting() {
	return render(AuthWaiting, {
		providers: [
			{ provide: AuthService, useValue: mockAuthService },
			provideRouter([]),
			provideTranslocoTesting(),
		],
	});
}

describe('AuthWaiting', () => {
	it('should show the check your inbox heading', async () => {
		await renderWaiting();
		expect(screen.getByRole('heading', { name: /check your inbox/i })).toBeTruthy();
	});

	it('should display the email address stored in localStorage', async () => {
		localStorage.setItem('emailForSignIn', 'user@example.com');
		await renderWaiting();
		expect(screen.getByText('user@example.com')).toBeTruthy();
	});

	it('should show a fallback when no email is in localStorage', async () => {
		await renderWaiting();
		expect(screen.getByText(/sign-in link to your inbox/i)).toBeTruthy();
		expect(screen.queryByText('user@example.com')).toBeNull();
	});

	it('should show a link to go back to login', async () => {
		await renderWaiting();
		expect(screen.getByRole('link', { name: /try a different email/i })).toBeTruthy();
	});

	it('should show a spam disclaimer', async () => {
		await renderWaiting();
		expect(screen.getByText(/spam/i)).toBeTruthy();
	});

	it("should show a 'close this window' message when the user signs in from another tab", async () => {
		mockCurrentUser.set({ uid: 'test-uid' });
		await renderWaiting();
		expect(screen.getByText(/close this window/i)).toBeTruthy();
	});

	it('should hide the inbox content once the user has signed in', async () => {
		mockCurrentUser.set({ uid: 'test-uid' });
		await renderWaiting();
		expect(screen.queryByRole('heading', { name: /check your inbox/i })).toBeNull();
	});

	it('should update reactively when the user signs in from another tab', async () => {
		const { fixture } = await renderWaiting();
		expect(screen.getByRole('heading', { name: /check your inbox/i })).toBeTruthy();

		mockCurrentUser.set({ uid: 'test-uid' });
		await fixture.whenStable();

		expect(screen.getByText(/close this window/i)).toBeTruthy();
	});
});
