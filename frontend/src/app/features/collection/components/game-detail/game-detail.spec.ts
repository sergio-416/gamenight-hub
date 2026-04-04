import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, ErrorHandler } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { ToastService } from '@core/services/toast';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { fireEvent, type RenderResult, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { GameDetail } from './game-detail';

describe('GameDetail', () => {
	let fixture: RenderResult<GameDetail>['fixture'];
	let httpTesting: HttpTestingController;

	const mockGame = {
		id: '1',
		bggId: 13,
		name: 'Catan',
		yearPublished: 1995,
		minPlayers: 3,
		maxPlayers: 4,
		playingTime: 120,
		minAge: 10,
		description: 'A game about settling an island',
		categories: ['Strategy', 'Economic'],
		mechanics: ['Trading', 'Dice Rolling'],
		publisher: 'KOSMOS',
		status: 'owned',
		notes: 'My favorite game!',
		complexity: 3,
		bggRating: 7.45,
		bggRank: 42,
		recommendations: [],
	};

	const mockRouter = { navigate: vi.fn() };
	const mockToast = { error: vi.fn(), success: vi.fn() };
	const silentErrorHandler = { handleError: () => {} };

	const gameUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.games}/1/enriched`;

	beforeEach(async () => {
		vi.clearAllMocks();

		const rendered = await render<GameDetail>(GameDetail, {
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				{ provide: Router, useValue: mockRouter },
				{ provide: ToastService, useValue: mockToast },
				{ provide: ErrorHandler, useValue: silentErrorHandler },
				{
					provide: ActivatedRoute,
					useValue: { paramMap: of(convertToParamMap({ id: '1' })) },
				},
			],
		});

		fixture = rendered.fixture;
		httpTesting = fixture.debugElement.injector.get(HttpTestingController);
	});

	afterEach(() => {
		httpTesting
			.match(() => true)
			.forEach((r) => {
				r.flush([]);
			});
		httpTesting.verify();
	});

	function drainBackground(): void {
		httpTesting
			.match((req) => req.url !== gameUrl)
			.forEach((r) => {
				r.flush([]);
			});
	}

	async function loadGame(): Promise<void> {
		fixture.detectChanges();
		drainBackground();
		const req = httpTesting.expectOne(gameUrl);
		req.flush(mockGame);
		drainBackground();
		await fixture.debugElement.injector.get(ApplicationRef).whenStable();
		fixture.detectChanges();
	}

	describe('initialization', () => {
		it('should load game details on init', async () => {
			await loadGame();

			expect(screen.getAllByText(/Catan/).length).toBeGreaterThanOrEqual(1);
			expect(screen.getByText(/1995/)).toBeTruthy();
			expect(screen.getByText(/3-4/)).toBeTruthy();
		});

		it('should display game name', async () => {
			await loadGame();

			expect(screen.getAllByText(/Catan/).length).toBeGreaterThanOrEqual(1);
		});

		it('should display game details', async () => {
			await loadGame();

			expect(screen.getByText(/1995/)).toBeTruthy();
			expect(screen.getByText(/3-4/)).toBeTruthy();
			expect(screen.getByText(/120/)).toBeTruthy();
		});

		it('should display categories', async () => {
			await loadGame();

			expect(screen.getByText(/Strategy/)).toBeTruthy();
			expect(screen.getByText(/Economic/)).toBeTruthy();
		});

		it('should display mechanics', async () => {
			await loadGame();

			expect(screen.getByText(/Trading/)).toBeTruthy();
			expect(screen.getByText(/Dice Rolling/)).toBeTruthy();
		});

		it('should show owned badge when game is owned', async () => {
			await loadGame();

			expect(screen.getAllByText(/Owned/).length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('navigation', () => {
		it('should navigate back to collection when back button clicked', async () => {
			await loadGame();

			const backButton = screen.getByRole('button', {
				name: /Go back to collection/,
			});
			fireEvent.click(backButton);

			expect(mockRouter.navigate).toHaveBeenCalledWith(['/collection']);
		});
	});

	describe('error handling', () => {
		it('should show error when game fails to load', async () => {
			fixture.detectChanges();
			drainBackground();

			const req = httpTesting.expectOne(gameUrl);
			req.flush('Not Found', { status: 404, statusText: 'Not Found' });
			drainBackground();

			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toBeTruthy();
		});
	});

	describe('stat cards', () => {
		it('should display stat cards with BGG data', async () => {
			await loadGame();

			expect(screen.getByText(/7.45/)).toBeTruthy();
			expect(screen.getByText(/#42/)).toBeTruthy();
			expect(screen.getByText(/3\/5/)).toBeTruthy();
			expect(screen.getByText(/Medium/)).toBeTruthy();
		});

		it('should show N/A when BGG data is null', async () => {
			const gameWithoutBgg = {
				...mockGame,
				bggRating: null,
				bggRank: null,
				bggId: null,
			};
			fixture.detectChanges();
			drainBackground();
			const req = httpTesting.expectOne(gameUrl);
			req.flush(gameWithoutBgg);
			drainBackground();
			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			const naElements = screen.getAllByText(/N\/A/);
			expect(naElements.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('weight label', () => {
		it('should show correct weight label for complexity', async () => {
			await loadGame();

			expect(screen.getByText(/Medium/)).toBeTruthy();
		});

		it('should show Not rated when complexity is null', async () => {
			const gameNoComplexity = { ...mockGame, complexity: null };
			fixture.detectChanges();
			drainBackground();
			const req = httpTesting.expectOne(gameUrl);
			req.flush(gameNoComplexity);
			drainBackground();
			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			expect(screen.getByText(/Not rated/)).toBeTruthy();
		});
	});

	describe('CTA buttons', () => {
		it('should show Owned badge when status is owned', async () => {
			await loadGame();

			expect(screen.getAllByText('Owned').length).toBeGreaterThanOrEqual(1);
		});

		it('should show Add to Collection button when status is want_to_try', async () => {
			const gameWantToTry = { ...mockGame, status: 'want_to_try' };
			fixture.detectChanges();
			drainBackground();
			const req = httpTesting.expectOne(gameUrl);
			req.flush(gameWantToTry);
			drainBackground();
			await fixture.debugElement.injector.get(ApplicationRef).whenStable();
			fixture.detectChanges();

			expect(screen.getByText(/Add to Collection/)).toBeTruthy();
			expect(screen.getByText(/Wishlist Game/)).toBeTruthy();
		});
	});

	describe('BGG attribution', () => {
		it('should show BGG attribution footer', async () => {
			await loadGame();

			expect(screen.getByText(/BoardGameGeek/)).toBeTruthy();
		});
	});
});
