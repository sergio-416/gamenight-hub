import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { PAGINATION } from '@gamenight-hub/shared';
import { render, screen } from '@testing-library/angular';
import { Collection } from './collection';
import { GamesService } from './services/games';

function makeProviders(isLoggedIn = true) {
	return [
		provideHttpClient(),
		provideHttpClientTesting(),
		provideRouter([]),
		provideTranslocoTesting(),
		{
			provide: AuthService,
			useValue: {
				isLoggedIn: signal(isLoggedIn).asReadonly(),
				userRole: () => 'user' as const,
				userType: () => 'regular' as const,
			},
		},
		{
			provide: GamesService,
			useValue: { deleteGame: vi.fn() },
		},
		{
			provide: ToastService,
			useValue: { success: vi.fn(), error: vi.fn() },
		},
	];
}

describe('Collection', () => {
	describe('when the user is authenticated', () => {
		it('should render the game list', async () => {
			const { fixture } = await render(Collection, {
				providers: makeProviders(true),
			});

			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.games}`).flush({
				data: [],
				total: 0,
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
				totalPages: 0,
			});

			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			expect(screen.getByText(/Your collection is empty/)).toBeTruthy();
		});

		it('should not show the unauthenticated page', async () => {
			const { fixture } = await render(Collection, {
				providers: makeProviders(true),
			});

			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.games}`).flush({
				data: [],
				total: 0,
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
				totalPages: 0,
			});

			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			expect(screen.queryByRole('heading', { name: /your board game collection/i })).toBeFalsy();
		});
	});

	describe('when the user is not authenticated', () => {
		beforeEach(async () => {
			await render(Collection, { providers: makeProviders(false) });
		});

		it('should show the unauthenticated page heading', () => {
			expect(screen.getByRole('heading', { name: /your board game collection/i })).toBeTruthy();
		});

		it('should show a sign in link', () => {
			expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy();
		});

		it('should show a create account link', () => {
			expect(screen.getByRole('link', { name: /create an account/i })).toBeTruthy();
		});

		it('should not render the game list', () => {
			expect(screen.queryByText(/Your collection is empty/i)).toBeFalsy();
		});
	});
});
