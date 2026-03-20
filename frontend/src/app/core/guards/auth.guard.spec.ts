import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
	type ActivatedRouteSnapshot,
	provideRouter,
	type RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { AuthService } from '@core/services/auth';
import { type Observable, of } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
	const isLoggedIn = signal(false);
	const mockAuthService = {
		isLoggedIn: isLoggedIn.asReadonly(),
		authReady$: of(true),
	};
	const mockRoute = {} as ActivatedRouteSnapshot;
	const mockState = {} as RouterStateSnapshot;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
		});
	});

	it('should allow access when user is authenticated', async () => {
		isLoggedIn.set(true);

		const result = await new Promise((resolve) => {
			(
				TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<unknown>
			).subscribe(resolve);
		});

		expect(result).toBe(true);
	});

	it('should redirect to /login when user is not authenticated', async () => {
		isLoggedIn.set(false);

		const result = await new Promise((resolve) => {
			(
				TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)) as Observable<unknown>
			).subscribe(resolve);
		});

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/login');
	});
});
