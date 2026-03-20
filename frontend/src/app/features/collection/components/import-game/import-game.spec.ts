import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { fireEvent, type RenderResult, render, screen } from '@testing-library/angular';
import { of, throwError } from 'rxjs';
import { GamesService } from '../../services/games';
import { ImportGame } from './import-game';

describe('ImportGame', () => {
	let fixture: RenderResult<ImportGame>['fixture'];
	let router: Router;

	const mockOwnedBggIds = signal(new Set<number>());

	const mockGamesService = {
		search: vi.fn(),
		importGame: vi.fn(),
		ownedBggIds: mockOwnedBggIds.asReadonly(),
		reloadOwnedBggIds: vi.fn(),
	};

	const mockToastService = {
		success: vi.fn(),
		error: vi.fn(),
	};

	async function setup(queryParams: Record<string, string> = {}) {
		const routes = queryParams['q'] ? [{ path: 'collection/import', component: ImportGame }] : [];
		const rendered = await render(ImportGame, {
			providers: [
				provideRouter(routes),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				{
					provide: AuthService,
					useValue: { isLoggedIn: signal(true).asReadonly() },
				},
				{ provide: GamesService, useValue: mockGamesService },
				{ provide: ToastService, useValue: mockToastService },
			],
		});

		fixture = rendered.fixture;
		router = fixture.debugElement.injector.get(Router);
		vi.spyOn(router, 'navigate').mockResolvedValue(true);
	}

	afterEach(() => {
		const httpMock = TestBed.inject(HttpTestingController);
		httpMock
			.match(() => true)
			.forEach((r) => {
				r.flush({});
			});
		vi.clearAllMocks();
		mockOwnedBggIds.set(new Set());
	});

	describe('search functionality', () => {
		beforeEach(() => setup());

		it('should display search input and button', () => {
			expect(screen.getByLabelText('Search for board games')).toBeTruthy();
			expect(screen.getByRole('button', { name: /^Search$/i })).toBeTruthy();
		});

		it('should call search when search button clicked', async () => {
			mockGamesService.search.mockReturnValue(of([]));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));

			expect(mockGamesService.search).toHaveBeenCalledWith('Catan');
		});

		it('should update URL with query param on search', async () => {
			mockGamesService.search.mockReturnValue(of([]));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));

			expect(router.navigate).toHaveBeenCalledWith([], {
				queryParams: { q: 'Catan' },
				queryParamsHandling: 'merge',
			});
		});

		it('should display search results when games found', async () => {
			const mockResults = [
				{
					bggId: 13,
					name: 'Catan',
					yearPublished: 1995,
					rank: '1',
					source: 'local' as const,
				},
				{
					bggId: 42,
					name: 'Ticket to Ride',
					yearPublished: 2004,
					rank: '2',
					source: 'local' as const,
				},
			];

			mockGamesService.search.mockReturnValue(of(mockResults));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
			fixture.detectChanges();

			expect(screen.getByText(/Catan/)).toBeTruthy();
			expect(screen.getByText(/Ticket to Ride/)).toBeTruthy();
		});

		it('should display error message when search fails', async () => {
			mockGamesService.search.mockReturnValue(throwError(() => new Error('Network error')));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toBeTruthy();
			expect(screen.getByText(/Failed to search games/)).toBeTruthy();
		});
	});

	describe('import functionality', () => {
		beforeEach(() => setup());

		it('should call importGame when import button clicked', async () => {
			mockGamesService.search.mockReturnValue(
				of([
					{
						bggId: 13,
						name: 'Catan',
						yearPublished: 1995,
						rank: '1',
						source: 'local',
					},
				]),
			);
			mockGamesService.importGame.mockReturnValue(of({}));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
			fixture.detectChanges();

			const importButton = screen.getByRole('button', {
				name: /Import Catan/i,
			});
			await fireEvent.click(importButton);

			expect(mockGamesService.importGame).toHaveBeenCalledWith(13, {
				status: 'owned',
			});
		});

		it('should show success toast and mark game as owned after successful import', async () => {
			mockGamesService.search.mockReturnValue(
				of([
					{
						bggId: 13,
						name: 'Catan',
						yearPublished: 1995,
						rank: '1',
						source: 'local',
					},
				]),
			);
			mockGamesService.importGame.mockReturnValue(of({}));
			mockGamesService.reloadOwnedBggIds.mockImplementation(() => {
				mockOwnedBggIds.set(new Set([13]));
			});

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
			fixture.detectChanges();

			const importButton = screen.getByRole('button', {
				name: /Import Catan/i,
			});
			await fireEvent.click(importButton);
			fixture.detectChanges();

			expect(mockToastService.success).toHaveBeenCalledWith('Game imported successfully!');
			expect(screen.getByText('In Collection')).toBeTruthy();
		});

		it('should display error message when import fails', async () => {
			mockGamesService.search.mockReturnValue(
				of([
					{
						bggId: 13,
						name: 'Catan',
						yearPublished: 1995,
						rank: '1',
						source: 'local',
					},
				]),
			);
			mockGamesService.importGame.mockReturnValue(throwError(() => new Error('Import error')));

			await fireEvent.input(screen.getByLabelText('Search for board games'), {
				target: { value: 'Catan' },
			});
			fixture.detectChanges();

			await fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
			fixture.detectChanges();

			const importButton = screen.getByRole('button', {
				name: /Import Catan/i,
			});
			await fireEvent.click(importButton);
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toBeTruthy();
			expect(screen.getByText(/Failed to import game/)).toBeTruthy();
		});
	});

	describe('navigation', () => {
		beforeEach(() => setup());

		it('should navigate back to collection when back button clicked', async () => {
			const backButton = screen.getByRole('button', {
				name: /Go back to collection/,
			});
			await fireEvent.click(backButton);

			expect(router.navigate).toHaveBeenCalledWith(['/collection']);
		});
	});
});
