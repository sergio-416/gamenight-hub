import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { EMPTY } from 'rxjs';
import { App } from './app';
import { AuthService } from './core/services/auth';

describe('App', () => {
	const mockAuthService = {
		isLoggedIn: signal(false),
		currentUser: signal(null),
		userRole: signal<'admin' | 'moderator' | 'user'>('user'),
		userType: signal<'regular' | 'store_organiser'>('regular'),
		login: vi.fn(),
		logout: vi.fn(),
	};

	const mockSwUpdate = {
		isEnabled: false,
		versionUpdates: EMPTY,
		available: EMPTY,
		activated: EMPTY,
		unrecoverable: EMPTY,
	};

	it('should render the application shell', async () => {
		await render(App, {
			providers: [
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: SwUpdate, useValue: mockSwUpdate },
			],
		});

		expect(screen.getByRole('banner')).toBeTruthy();
		expect(screen.getByRole('main')).toBeTruthy();
	});

	it('should display skip to main content link', async () => {
		await render(App, {
			providers: [
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: SwUpdate, useValue: mockSwUpdate },
			],
		});

		expect(screen.getByText('Skip to main content')).toBeTruthy();
	});
});
