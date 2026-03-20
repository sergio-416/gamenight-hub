import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { User } from '@angular/fire/auth';
import { of } from 'rxjs';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth';

describe('authInterceptor', () => {
	let httpClient: HttpClient;
	let httpTestingController: HttpTestingController;

	afterEach(() => {
		httpTestingController.verify();
	});

	describe('when user is authenticated (idToken$ emits a token)', () => {
		beforeEach(() => {
			const mockAuthService = {
				currentUser: signal<User | null>({} as User),
				idToken$: of('firebase-id-token-123'),
			};

			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(withInterceptors([authInterceptor])),
					provideHttpClientTesting(),
					{ provide: AuthService, useValue: mockAuthService },
				],
			});

			httpClient = TestBed.inject(HttpClient);
			httpTestingController = TestBed.inject(HttpTestingController);
		});

		it('should add Authorization header with Bearer token', () => {
			httpClient.get('/api/test').subscribe();

			const req = httpTestingController.expectOne('/api/test');

			expect(req.request.headers.has('Authorization')).toBe(true);
			expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-id-token-123');

			req.flush({ message: 'test' });
		});
	});

	describe('when user is not authenticated (idToken$ emits null)', () => {
		beforeEach(() => {
			const mockAuthService = {
				currentUser: signal<User | null>(null),
				idToken$: of(null),
			};

			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(withInterceptors([authInterceptor])),
					provideHttpClientTesting(),
					{ provide: AuthService, useValue: mockAuthService },
				],
			});

			httpClient = TestBed.inject(HttpClient);
			httpTestingController = TestBed.inject(HttpTestingController);
		});

		it('should not add Authorization header', () => {
			httpClient.get('/api/test').subscribe();

			const req = httpTestingController.expectOne('/api/test');

			expect(req.request.headers.has('Authorization')).toBe(false);

			req.flush({ message: 'test' });
		});
	});

	describe('when a background token refresh has occurred', () => {
		beforeEach(() => {
			const mockAuthService = {
				currentUser: signal<User | null>({} as User),
				idToken$: of('refreshed-token-456'),
			};

			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(withInterceptors([authInterceptor])),
					provideHttpClientTesting(),
					{ provide: AuthService, useValue: mockAuthService },
				],
			});

			httpClient = TestBed.inject(HttpClient);
			httpTestingController = TestBed.inject(HttpTestingController);
		});

		it('should use the latest token from idToken$ observable', () => {
			httpClient.get('/api/test').subscribe();

			const req = httpTestingController.expectOne('/api/test');

			expect(req.request.headers.get('Authorization')).toBe('Bearer refreshed-token-456');

			req.flush({ data: 'ok' });
		});
	});
});
