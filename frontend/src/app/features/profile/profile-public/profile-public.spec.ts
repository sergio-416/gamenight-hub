import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen, waitFor } from '@testing-library/angular';
import { ProfilePublic } from './profile-public';

const baseUrl = API_CONFIG.baseUrl;

const makeProfile = (overrides = {}) => ({
	username: 'jane_boards',
	firstName: null,
	lastName: null,
	avatar: null,
	bio: 'Strategy game enthusiast',
	location: 'London',
	isProfilePublic: true,
	showLocation: false,
	showGameCollection: true,
	createdAt: '2026-01-01T00:00:00Z',
	...overrides,
});

const makeGamesResponse = (overrides = {}) => ({
	data: [],
	total: 0,
	...overrides,
});

const makeXpResponse = (overrides = {}) => ({
	level: 1,
	title: 'Novice Adventurer',
	xpTotal: 0,
	nextLevelXp: 250,
	progressPercent: 0,
	weekStreak: 0,
	...overrides,
});

function makeActivatedRoute(username: string) {
	return {
		provide: ActivatedRoute,
		useValue: { snapshot: { params: { username } } },
	};
}

async function renderProfilePublic(username = 'jane_boards') {
	const result = await render(ProfilePublic, {
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			provideRouter([]),
			provideTranslocoTesting(),
			makeActivatedRoute(username),
		],
	});

	const httpMock = result.fixture.debugElement.injector.get(HttpTestingController);
	return { ...result, httpMock };
}

function flushAll(
	httpMock: HttpTestingController,
	username: string,
	profileData = makeProfile(),
	gamesData = makeGamesResponse(),
	xpData = makeXpResponse(),
) {
	httpMock.expectOne(`${baseUrl}/profile/${username}`).flush(profileData);
	httpMock.expectOne(`${baseUrl}/profile/${username}/games`).flush(gamesData);
	httpMock.expectOne(`${baseUrl}/profile/${username}/xp`).flush(xpData);
}

function drainPending(httpMock: HttpTestingController) {
	httpMock.match(() => true);
}

describe('ProfilePublic', () => {
	describe('loading state', () => {
		it('should show loading indicator while fetching profile', async () => {
			const { httpMock } = await renderProfilePublic();

			expect(screen.getByText(/loading/i)).toBeTruthy();

			drainPending(httpMock);
			httpMock.verify();
		});
	});

	describe('profile display', () => {
		it('should display the username of the public profile', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(httpMock, 'jane_boards');

			await waitFor(() => {
				expect(screen.getByText('jane_boards')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should display bio of the public profile', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(httpMock, 'jane_boards');

			await waitFor(() => {
				expect(screen.getByText('Strategy game enthusiast')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should display location when present in response', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(httpMock, 'jane_boards', makeProfile({ location: 'London' }));

			await waitFor(() => {
				expect(screen.getByText('London')).toBeTruthy();
			});

			httpMock.verify();
		});

		it('should NOT display location when not in response', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(httpMock, 'jane_boards', makeProfile({ location: null }));

			await waitFor(() => screen.getByText('jane_boards'));

			expect(screen.queryByText('London')).toBeNull();

			httpMock.verify();
		});

		it('should NOT show an edit button on a public profile', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(httpMock, 'jane_boards');

			await waitFor(() => screen.getByText('jane_boards'));

			expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();

			httpMock.verify();
		});
	});

	describe('not found state', () => {
		it('should show a not found message when profile does not exist or is private', async () => {
			const { httpMock } = await renderProfilePublic('ghost_user');

			httpMock
				.expectOne(`${baseUrl}/profile/ghost_user`)
				.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

			drainPending(httpMock);

			await waitFor(() => {
				expect(screen.getByText(/profile not found/i)).toBeTruthy();
			});

			httpMock.verify();
		});
	});

	describe('xp display', () => {
		it('should display the user level from XP endpoint', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(
				httpMock,
				'jane_boards',
				makeProfile(),
				makeGamesResponse(),
				makeXpResponse({ level: 5, title: 'Dungeon Master' }),
			);

			await waitFor(() => {
				expect(screen.getByText('5')).toBeTruthy();
			});

			httpMock.verify();
		});
	});

	describe('games display', () => {
		it('should display game names from the games endpoint', async () => {
			const { httpMock } = await renderProfilePublic();

			flushAll(
				httpMock,
				'jane_boards',
				makeProfile(),
				makeGamesResponse({
					data: [
						{
							id: 'g1',
							name: 'Catan',
							status: 'owned',
							thumbnailUrl: null,
							imageUrl: null,
							yearPublished: 1995,
						},
					],
					total: 1,
				}),
			);

			await waitFor(() => {
				expect(screen.getByText('Catan')).toBeTruthy();
			});

			httpMock.verify();
		});
	});
});
