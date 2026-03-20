import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Header } from './header';

function makeAuthService(
	overrides: { isLoggedIn?: boolean; role?: string; photoURL?: string | null } = {},
) {
	return {
		isLoggedIn: signal(overrides.isLoggedIn ?? false),
		currentUser: signal(
			overrides.photoURL !== undefined ? { photoURL: overrides.photoURL, displayName: null } : null,
		),
		userRole: signal(overrides.role ?? 'user'),
		logout: vi.fn(),
	};
}

async function renderHeader(authService: ReturnType<typeof makeAuthService>) {
	return render(Header, {
		providers: [
			provideRouter([]),
			provideHttpClient(),
			provideHttpClientTesting(),
			provideTranslocoTesting(),
			{ provide: AuthService, useValue: authService },
		],
	});
}

describe('Header — Navigation links', () => {
	it('logged-out: shows Game Nights and Sign In only', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: false }));

		expect(screen.getByRole('link', { name: /Game Nights/i })).toBeTruthy();
		expect(screen.queryByRole('link', { name: /Home/i })).toBeNull();
		expect(screen.queryByRole('link', { name: /Collection/i })).toBeNull();
		expect(screen.queryByRole('link', { name: /Calendar/i })).toBeNull();
		expect(screen.queryByRole('link', { name: /Notifications/i })).toBeNull();
		expect(screen.queryByRole('link', { name: /my profile/i })).toBeNull();
	});

	it('logged-in: shows Collection, Game Nights, Calendar, bell, and avatar; Home and Sign In absent', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true }));

		expect(screen.getByRole('link', { name: /Collection/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Game Nights/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Calendar/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Notifications/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /my profile/i })).toBeTruthy();
		expect(screen.queryByRole('link', { name: /Home/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /login/i })).toBeNull();
	});

	it('should NOT show Stats link to regular users', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true, role: 'user' }));

		expect(screen.queryByRole('link', { name: /Stats/i })).toBeNull();
	});

	it('should NOT show Stats link to unauthenticated users', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: false, role: 'user' }));

		expect(screen.queryByRole('link', { name: /Stats/i })).toBeNull();
	});

	it('should show Stats link to moderators', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true, role: 'moderator' }));

		expect(screen.getByRole('link', { name: /Stats/i })).toBeTruthy();
	});

	it('should show Stats link to admins', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true, role: 'admin' }));

		expect(screen.getByRole('link', { name: /Stats/i })).toBeTruthy();
	});
});

describe('Header — Profile link', () => {
	it('should NOT show profile link when user is not logged in', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: false }));

		expect(screen.queryByRole('link', { name: /my profile/i })).toBeNull();
	});

	it('should show profile link to /profile/me when user is logged in', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true }));

		const link = screen.getByRole('link', { name: /my profile/i });
		expect(link).toBeTruthy();
		expect(link.getAttribute('href')).toBe('/profile/me');
	});
});

describe('Header — Authentication', () => {
	it('should display login button when user is not authenticated', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: false }));

		expect(screen.getByRole('button', { name: /login/i })).toBeTruthy();
	});

	it('should display user avatar when user is authenticated with photo', async () => {
		await renderHeader(
			makeAuthService({
				isLoggedIn: true,
				photoURL: 'https://example.com/avatar.jpg',
			}),
		);

		expect(screen.getByAltText('User avatar')).toBeTruthy();
	});

	it('should NOT display logout button when user is authenticated', async () => {
		await renderHeader(makeAuthService({ isLoggedIn: true }));

		expect(screen.queryByRole('button', { name: /logout/i })).toBeNull();
	});

	it('should navigate to login page when login button is clicked', async () => {
		const authService = makeAuthService({ isLoggedIn: false });
		const { fixture } = await render(Header, {
			providers: [
				provideRouter([{ path: 'login', component: Header }]),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				{ provide: AuthService, useValue: authService },
			],
		});

		const router = fixture.debugElement.injector.get(Router);
		const navigateSpy = vi.spyOn(router, 'navigate');

		fireEvent.click(screen.getByRole('button', { name: /login/i }));

		expect(navigateSpy).toHaveBeenCalledWith(['/login']);
	});
});
