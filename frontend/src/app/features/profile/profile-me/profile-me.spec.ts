import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ProfileMe } from './profile-me';

const baseUrl = API_CONFIG.baseUrl;

const makeProfile = (overrides = {}) => ({
	uid: 'user-uid-123',
	firstName: null,
	lastName: null,
	username: 'john_doe',
	email: null,
	backupEmail: null,
	mobilePhone: null,
	avatar: null,
	bio: 'I love board games',
	location: 'Barcelona',
	postalZip: null,
	birthday: null,
	isProfilePublic: false,
	useRealNameForContact: false,
	showFirstName: true,
	showLastName: true,
	showLocation: false,
	showPostalZip: false,
	showBirthday: false,
	showMobilePhone: false,
	showBackupEmail: false,
	showEmail: false,
	showGameCollection: true,
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
	...overrides,
});

const mockAuthService = {
	isLoggedIn: signal(true),
	currentUser: signal({
		uid: 'user-uid-123',
		photoURL: null,
		displayName: 'John',
	}),
	userRole: signal('user'),
	userType: signal('regular'),
	logout: vi.fn(),
};

async function renderProfileMe() {
	const result = await render(ProfileMe, {
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			provideRouter([]),
			provideTranslocoTesting(),
			{ provide: AuthService, useValue: mockAuthService },
		],
	});

	const httpMock = result.fixture.debugElement.injector.get(HttpTestingController);
	return { ...result, httpMock };
}

function flushInitialRequests(httpMock: HttpTestingController, profileOverrides = {}) {
	httpMock
		.match((req) => req.url.includes('owned-bgg-ids'))
		.forEach((r) => {
			r.flush([]);
		});
	httpMock.expectOne(`${baseUrl}/profile/me`).flush(makeProfile(profileOverrides));
	httpMock
		.expectOne(`${baseUrl}/games`)
		.flush({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
	flushXpRequests(httpMock);
}

function flushXpRequests(httpMock: HttpTestingController) {
	httpMock
		.match((r) => r.url === `${baseUrl}/xp/me`)
		.forEach((r) => {
			r.flush({
				userId: 'user-uid-123',
				xpTotal: 0,
				level: 1,
				streakWeeks: 0,
				lastActivityAt: null,
				levelTitle: 'Wandering Pawn',
				nextLevelXp: 100,
				xpToNextLevel: 100,
				progressPercent: 0,
			});
		});
	httpMock
		.match((r) => r.url.includes('/xp/me/stats'))
		.forEach((r) => {
			r.flush({
				monthlyXp: 0,
				weeklyXp: 0,
				totalTransactions: 0,
				currentStreak: 0,
				longestStreak: 0,
				topAction: null,
			});
		});
	httpMock
		.match((r) => r.url.includes('/xp/me/history'))
		.forEach((r) => {
			r.flush({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
		});
}

describe('ProfileMe', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('loading state', () => {
		it('should show loading indicator while fetching profile', async () => {
			const { httpMock } = await renderProfileMe();

			expect(screen.getByText(/loading/i)).toBeTruthy();

			flushInitialRequests(httpMock);
			httpMock.verify();
		});
	});

	describe('profile display', () => {
		it('should display username after profile loads', async () => {
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => {
				expect(screen.getByText('john_doe')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should display bio after profile loads', async () => {
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => {
				expect(screen.getByText('I love board games')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should display location after profile loads', async () => {
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => {
				expect(screen.getByText('Barcelona')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should show edit button so user can update their profile', async () => {
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /profile settings/i })).toBeTruthy();
			});

			httpMock.verify();
		});
	});

	describe('edit mode', () => {
		it('should show bio input when user clicks edit profile', async () => {
			const user = userEvent.setup();
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => screen.getByRole('button', { name: /profile settings/i }));

			await user.click(screen.getByRole('button', { name: /profile settings/i }));

			expect(screen.getByLabelText(/bio/i)).toBeTruthy();

			flushXpRequests(httpMock);
			httpMock.verify();
		});

		it('should show save button in edit mode', async () => {
			const user = userEvent.setup();
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => screen.getByRole('button', { name: /profile settings/i }));
			await user.click(screen.getByRole('button', { name: /profile settings/i }));

			expect(screen.getByRole('button', { name: /save/i })).toBeTruthy();

			flushXpRequests(httpMock);
			httpMock.verify();
		});

		it('should submit updated profile when user saves', async () => {
			const user = userEvent.setup();
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => screen.getByRole('button', { name: /profile settings/i }));
			await user.click(screen.getByRole('button', { name: /profile settings/i }));

			const bioInput = screen.getByLabelText(/bio/i);
			await user.clear(bioInput);
			await user.type(bioInput, 'Updated bio text');

			await user.click(screen.getByRole('button', { name: /save/i }));

			const patchReq = httpMock.expectOne(`${baseUrl}/profile/me`);
			expect(patchReq.request.method).toBe('PATCH');
			patchReq.flush(makeProfile({ bio: 'Updated bio text' }));

			await waitFor(() => {
				expect(screen.getByText('Updated bio text')).toBeTruthy();
			});

			flushXpRequests(httpMock);
			httpMock.verify();
		});

		it('should hide edit form and show profile after successful save', async () => {
			const user = userEvent.setup();
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => screen.getByRole('button', { name: /profile settings/i }));
			await user.click(screen.getByRole('button', { name: /profile settings/i }));
			await user.click(screen.getByRole('button', { name: /save/i }));

			httpMock.expectOne(`${baseUrl}/profile/me`).flush(makeProfile());

			await waitFor(() => {
				expect(screen.queryByLabelText(/bio/i)).toBeNull();
				expect(screen.getByRole('button', { name: /profile settings/i })).toBeTruthy();
			});

			flushXpRequests(httpMock);
			httpMock.verify();
		});
	});

	describe('privacy controls', () => {
		it('should show privacy toggle for profile visibility in edit mode', async () => {
			const user = userEvent.setup();
			const { httpMock } = await renderProfileMe();

			flushInitialRequests(httpMock);

			await waitFor(() => screen.getByRole('button', { name: /profile settings/i }));
			await user.click(screen.getByRole('button', { name: /profile settings/i }));

			expect(screen.getByLabelText(/public profile/i)).toBeTruthy();

			flushXpRequests(httpMock);
			httpMock.verify();
		});
	});
});
