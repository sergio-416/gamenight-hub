import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { API_CONFIG } from '@core/config/api.config';
import type { UserRole, UserType } from '@gamenight-hub/shared';
import { of } from 'rxjs';
import { AuthService, FIREBASE_AUTH_OPS, translateAuthError } from './auth';
import { NotificationsService } from './notifications.service';

const mockGetIdTokenResult = vi.fn().mockResolvedValue({ claims: {} });

function createMockUser(overrides: Record<string, unknown> = {}) {
	return {
		uid: 'user-123',
		email: 'test@example.com',
		getIdToken: vi.fn().mockResolvedValue('mock-token'),
		getIdTokenResult: mockGetIdTokenResult,
		...overrides,
	};
}

type AuthStateCallback = (_auth: unknown, callback: (user: unknown) => void) => () => void;

function createMockAuthOps(onAuthImpl?: AuthStateCallback) {
	return {
		onAuthStateChanged: vi
			.fn()
			.mockImplementation(
				onAuthImpl ?? ((_auth: unknown, _cb: (user: unknown) => void) => () => {}),
			),
		signInWithPopup: vi.fn().mockResolvedValue({ user: null }),
		signOut: vi.fn().mockResolvedValue(undefined),
		idToken: vi.fn().mockReturnValue(of(null)),
		isSignInWithEmailLink: vi.fn().mockReturnValue(false),
		signInWithEmailLink: vi.fn().mockResolvedValue({ user: null, operationType: 'signIn' }),
		getAdditionalUserInfo: vi.fn().mockReturnValue({ isNewUser: false }),
	};
}

const mockNotifications = { connect: vi.fn(), disconnect: vi.fn() };

function configureTestModule(onAuthImpl?: AuthStateCallback) {
	const mockAuthOps = createMockAuthOps(onAuthImpl);

	TestBed.configureTestingModule({
		providers: [
			AuthService,
			provideHttpClient(),
			provideHttpClientTesting(),
			{ provide: Auth, useValue: { authStateReady: () => Promise.resolve() } },
			{ provide: NotificationsService, useValue: mockNotifications },
			{ provide: FIREBASE_AUTH_OPS, useValue: mockAuthOps },
		],
	});

	return {
		service: TestBed.inject(AuthService),
		httpMock: TestBed.inject(HttpTestingController),
		mockAuthOps,
	};
}

describe('AuthService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockGetIdTokenResult.mockResolvedValue({ claims: {} });
	});

	describe('login', () => {
		let authStateCallback: (user: unknown) => void;
		let service: AuthService;
		let mockAuthOps: ReturnType<typeof createMockAuthOps>;

		beforeEach(() => {
			({ service, mockAuthOps } = configureTestModule(
				(_auth: unknown, callback: (user: unknown) => void) => {
					authStateCallback = callback;
					return () => {};
				},
			));
		});

		it('should sign in with Google popup', async () => {
			const mockUser = createMockUser();
			mockAuthOps.signInWithPopup.mockResolvedValue({ user: mockUser });

			await service.login();

			expect(mockAuthOps.signInWithPopup).toHaveBeenCalled();
		});

		it('should return isNewUser true for a first-time Google sign-in', async () => {
			const mockUser = createMockUser();
			mockAuthOps.signInWithPopup.mockResolvedValue({ user: mockUser });
			mockAuthOps.getAdditionalUserInfo.mockReturnValue({ isNewUser: true });

			const result = await service.login();

			expect(result.isNewUser).toBe(true);
		});

		it('should return isNewUser false for a returning Google user', async () => {
			const mockUser = createMockUser();
			mockAuthOps.signInWithPopup.mockResolvedValue({ user: mockUser });
			mockAuthOps.getAdditionalUserInfo.mockReturnValue({ isNewUser: false });

			const result = await service.login();

			expect(result.isNewUser).toBe(false);
		});

		it('should update currentUser signal when auth state fires after login', async () => {
			const mockUser = createMockUser();
			mockAuthOps.signInWithPopup.mockResolvedValue({ user: mockUser });

			await service.login();
			authStateCallback(mockUser);
			await vi.waitFor(() =>
				expect(mockNotifications.connect).toHaveBeenCalledWith('mock-token', 'user-123'),
			);

			expect(service.currentUser()).toEqual(mockUser);
		});
	});

	describe('logout', () => {
		let service: AuthService;
		let mockAuthOps: ReturnType<typeof createMockAuthOps>;

		beforeEach(() => {
			({ service, mockAuthOps } = configureTestModule());
		});

		it('should call signOut', async () => {
			await service.logout();

			expect(mockAuthOps.signOut).toHaveBeenCalled();
		});

		it('should clear currentUser signal', async () => {
			await service.logout();

			expect(service.currentUser()).toBeNull();
		});
	});

	describe('auth state', () => {
		it('should set currentUser when auth state changes to logged in', async () => {
			const mockUser = createMockUser();
			let authStateCallback!: (user: unknown) => void;

			const { service } = configureTestModule(
				(_auth: unknown, callback: (user: unknown) => void) => {
					authStateCallback = callback;
					return () => {};
				},
			);

			authStateCallback(mockUser);
			await vi.waitFor(() =>
				expect(mockNotifications.connect).toHaveBeenCalledWith('mock-token', 'user-123'),
			);

			expect(service.currentUser()).toEqual(mockUser);
		});

		it('should clear currentUser when auth state changes to logged out', () => {
			let authStateCallback!: (user: unknown) => void;

			const { service } = configureTestModule(
				(_auth: unknown, callback: (user: unknown) => void) => {
					authStateCallback = callback;
					return () => {};
				},
			);

			authStateCallback(null);

			expect(service.currentUser()).toBeNull();
			expect(mockNotifications.disconnect).toHaveBeenCalled();
		});
	});

	describe('isLoggedIn', () => {
		it('should return true when user is logged in', async () => {
			const mockUser = createMockUser();
			let authStateCallback!: (user: unknown) => void;

			const { service } = configureTestModule(
				(_auth: unknown, callback: (user: unknown) => void) => {
					authStateCallback = callback;
					return () => {};
				},
			);

			authStateCallback(mockUser);
			await vi.waitFor(() => expect(mockNotifications.connect).toHaveBeenCalled());

			expect(service.isLoggedIn()).toBe(true);
		});

		it('should return false when user is logged out', () => {
			let authStateCallback!: (user: unknown) => void;

			const { service } = configureTestModule(
				(_auth: unknown, callback: (user: unknown) => void) => {
					authStateCallback = callback;
					return () => {};
				},
			);

			authStateCallback(null);

			expect(service.isLoggedIn()).toBe(false);
		});
	});

	describe('userRole signal', () => {
		it("should be 'user' when no user is logged in", () => {
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(null);
				return () => {};
			});
			expect(service.userRole()).toBe('user');
		});

		it("should be 'admin' for admin accounts", async () => {
			mockGetIdTokenResult.mockResolvedValue({
				claims: { role: 'admin' as UserRole },
			});
			const mockUser = createMockUser();
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(mockUser);
				return () => {};
			});
			await vi.waitFor(() => expect(service.userRole()).toBe('admin'));
		});

		it("should be 'moderator' for moderator accounts", async () => {
			mockGetIdTokenResult.mockResolvedValue({
				claims: { role: 'moderator' as UserRole },
			});
			const mockUser = createMockUser();
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(mockUser);
				return () => {};
			});
			await vi.waitFor(() => expect(service.userRole()).toBe('moderator'));
		});

		it("should default to 'user' when role claim is absent", async () => {
			mockGetIdTokenResult.mockResolvedValue({ claims: {} });
			const mockUser = createMockUser();
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(mockUser);
				return () => {};
			});
			await vi.waitFor(() => expect(service.userRole()).toBe('user'));
		});
	});

	describe('userType signal', () => {
		it("should be 'regular' when no user is logged in", () => {
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(null);
				return () => {};
			});
			expect(service.userType()).toBe('regular');
		});

		it("should be 'store_organiser' for organiser accounts", async () => {
			mockGetIdTokenResult.mockResolvedValue({
				claims: { userType: 'store_organiser' as UserType },
			});
			const mockUser = createMockUser();
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(mockUser);
				return () => {};
			});
			await vi.waitFor(() => expect(service.userType()).toBe('store_organiser'));
		});

		it("should default to 'regular' when userType claim is absent", async () => {
			mockGetIdTokenResult.mockResolvedValue({ claims: {} });
			const mockUser = createMockUser();
			const { service } = configureTestModule((_: unknown, cb: (user: unknown) => void) => {
				cb(mockUser);
				return () => {};
			});
			await vi.waitFor(() => expect(service.userType()).toBe('regular'));
		});
	});

	describe('sendSignInLink', () => {
		it('should POST the email to the magic-link endpoint', async () => {
			const { service, httpMock } = configureTestModule();
			const expectedUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.magicLink}`;

			const promise = service.sendSignInLink('user@example.com');

			const req = httpMock.expectOne(expectedUrl);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ email: 'user@example.com' });
			req.flush({});

			await promise;
		});

		it('should save the email to localStorage', async () => {
			const { service, httpMock } = configureTestModule();
			const expectedUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.magicLink}`;

			const promise = service.sendSignInLink('user@example.com');
			httpMock.expectOne(expectedUrl).flush({});
			await promise;

			expect(localStorage.getItem('emailForSignIn')).toBe('user@example.com');
		});

		it('should propagate HTTP errors', async () => {
			const { service, httpMock } = configureTestModule();
			const expectedUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.magicLink}`;

			const promise = service.sendSignInLink('user@example.com');
			httpMock
				.expectOne(expectedUrl)
				.flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });

			await expect(promise).rejects.toBeInstanceOf(HttpErrorResponse);
		});
	});

	describe('completeSignInWithLink', () => {
		const validLink = 'http://localhost/auth/callback?oobCode=abc';

		it('should return isNewUser true when signing in for the first time', async () => {
			const mockUser = createMockUser();
			const { service, mockAuthOps } = configureTestModule();
			mockAuthOps.isSignInWithEmailLink.mockReturnValue(true);
			mockAuthOps.signInWithEmailLink.mockResolvedValue({
				user: mockUser,
				operationType: 'signIn',
			});
			mockAuthOps.getAdditionalUserInfo.mockReturnValue({ isNewUser: true });

			const result = await service.completeSignInWithLink('user@example.com', validLink);

			expect(result.isNewUser).toBe(true);
			expect(mockAuthOps.isSignInWithEmailLink).toHaveBeenCalledWith(expect.anything(), validLink);
			expect(mockAuthOps.signInWithEmailLink).toHaveBeenCalledWith(
				expect.anything(),
				'user@example.com',
				validLink,
			);
			expect(mockAuthOps.getAdditionalUserInfo).toHaveBeenCalledWith(
				expect.objectContaining({ user: mockUser, operationType: 'signIn' }),
			);
		});

		it('should return isNewUser false for a returning user', async () => {
			const mockUser = createMockUser();
			const { service, mockAuthOps } = configureTestModule();
			mockAuthOps.isSignInWithEmailLink.mockReturnValue(true);
			mockAuthOps.signInWithEmailLink.mockResolvedValue({
				user: mockUser,
				operationType: 'signIn',
			});
			mockAuthOps.getAdditionalUserInfo.mockReturnValue({ isNewUser: false });

			const result = await service.completeSignInWithLink('user@example.com', validLink);

			expect(result.isNewUser).toBe(false);
			expect(mockAuthOps.isSignInWithEmailLink).toHaveBeenCalledWith(expect.anything(), validLink);
		});

		it('should throw when the link is not a valid sign-in link', async () => {
			const { service, mockAuthOps } = configureTestModule();
			mockAuthOps.isSignInWithEmailLink.mockReturnValue(false);

			await expect(
				service.completeSignInWithLink('user@example.com', 'http://localhost/other'),
			).rejects.toThrow('invalid-sign-in-link');

			expect(mockAuthOps.isSignInWithEmailLink).toHaveBeenCalledWith(
				expect.anything(),
				'http://localhost/other',
			);
		});
	});
});

describe('translateAuthError', () => {
	it('should return rate-limit message for HTTP 429', () => {
		const error = new HttpErrorResponse({
			status: 429,
			statusText: 'Too Many Requests',
		});
		expect(translateAuthError(error)).toMatch(/wait/i);
	});

	it('should return invalid email message for HTTP 400', () => {
		const error = new HttpErrorResponse({
			status: 400,
			statusText: 'Bad Request',
		});
		expect(translateAuthError(error)).toMatch(/valid email/i);
	});

	it('should return fallback message for other HTTP errors', () => {
		const error = new HttpErrorResponse({
			status: 500,
			statusText: 'Internal Server Error',
		});
		expect(translateAuthError(error)).toMatch(/try again/i);
	});

	it('should return a message for invalid email errors', () => {
		expect(translateAuthError(new Error('auth/invalid-email'))).toMatch(/valid email/i);
	});

	it('should return a message for network errors', () => {
		expect(translateAuthError(new Error('network-request-failed'))).toMatch(/network/i);
	});

	it('should return a message for too-many-requests errors', () => {
		expect(translateAuthError(new Error('too-many-requests'))).toMatch(/wait/i);
	});

	it('should return a message for expired sign-in link errors', () => {
		expect(translateAuthError(new Error('auth/expired-action-code'))).toMatch(/expired/i);
	});

	it('should return a message for already-used sign-in link errors', () => {
		expect(translateAuthError(new Error('auth/invalid-action-code'))).toMatch(/already been used/i);
	});

	it('should return a fallback message for unknown errors', () => {
		expect(translateAuthError(new Error('something-random'))).toMatch(/try again/i);
	});

	it('should return a fallback message for non-Error values', () => {
		expect(translateAuthError('not an error')).toMatch(/try again/i);
	});
});
