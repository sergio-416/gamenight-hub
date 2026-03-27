import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { PAGINATION } from '@gamenight-hub/shared';
import { provideTranslocoScope } from '@jsverse/transloco';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { LEAFLET } from './components/map/map';
import { GameNights } from './game-nights';
import { LocationsService } from './services/locations';

const mockLeaflet = {
	map: vi.fn().mockReturnValue({
		setView: vi.fn().mockReturnThis(),
		on: vi.fn().mockReturnThis(),
		remove: vi.fn(),
		invalidateSize: vi.fn(),
		getBounds: vi.fn().mockReturnValue({
			getSouthWest: () => ({ lat: 41.3, lng: 2.1 }),
			getNorthEast: () => ({ lat: 41.5, lng: 2.2 }),
		}),
	}),
	tileLayer: vi.fn().mockReturnValue({
		addTo: vi.fn().mockReturnThis(),
	}),
	marker: vi.fn().mockReturnValue({
		bindPopup: vi.fn().mockReturnThis(),
		addTo: vi.fn().mockReturnThis(),
		on: vi.fn().mockReturnThis(),
	}),
	divIcon: vi.fn().mockReturnValue({}),
	DomEvent: {
		on: vi.fn(),
		stopPropagation: vi.fn(),
	},
};

function makeProviders(isLoggedIn = true) {
	return [
		provideTranslocoTesting(),
		provideTranslocoScope('game-nights'),
		provideHttpClient(),
		provideHttpClientTesting(),
		{
			provide: AuthService,
			useValue: {
				isLoggedIn: signal(isLoggedIn).asReadonly(),
				userRole: () => 'user' as const,
				userType: () => 'regular' as const,
			},
		},
		{
			provide: LocationsService,
			useValue: {
				findInBounds: vi.fn().mockReturnValue(of([])),
				deleteLocation: vi.fn().mockReturnValue(of({})),
			},
		},
		{
			provide: ToastService,
			useValue: { success: vi.fn(), error: vi.fn() },
		},
		{ provide: LEAFLET, useValue: mockLeaflet },
	];
}

describe('GameNights', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('page display', () => {
		it('should display page title when component loads', async () => {
			const { fixture } = await render(GameNights, {
				providers: makeProviders(),
			});

			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.expectOne(`${API_CONFIG.baseUrl}/locations`).flush({
				data: [],
				total: 0,
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
				totalPages: 0,
			});

			expect(screen.getByRole('heading', { name: /game nights/i })).toBeTruthy();
		});

		it('should display descriptive text about board game spots', async () => {
			const { fixture } = await render(GameNights, {
				providers: makeProviders(),
			});

			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.expectOne(`${API_CONFIG.baseUrl}/locations`).flush({
				data: [],
				total: 0,
				page: PAGINATION.DEFAULT_PAGE,
				limit: PAGINATION.DEFAULT_LIMIT,
				totalPages: 0,
			});

			expect(screen.getByText(/board game/i)).toBeTruthy();
		});
	});

	describe('map component', () => {
		it('should render the map component on page load', async () => {
			localStorage.setItem('gameNights_showMap', 'true');
			const { fixture, detectChanges } = await render(GameNights, {
				providers: makeProviders(),
			});

			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.match(`${API_CONFIG.baseUrl}/locations`).forEach((req) => {
				req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
			});
			httpMock.match(`${API_CONFIG.baseUrl}/events`).forEach((req) => {
				req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
			});
			httpMock
				.match(() => true)
				.forEach((req) => {
					req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
				});
			await fixture.whenStable();
			detectChanges();

			expect(screen.getByTestId('map-container')).toBeTruthy();
		});
	});

	describe('map toggle', () => {
		function flushHttp(fixture: {
			debugElement: {
				injector: {
					get: (token: typeof HttpTestingController) => HttpTestingController;
				};
			};
		}) {
			const httpMock = fixture.debugElement.injector.get(HttpTestingController);
			httpMock.match(`${API_CONFIG.baseUrl}/locations`).forEach((req) => {
				req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
			});
			httpMock.match(`${API_CONFIG.baseUrl}/events`).forEach((req) => {
				req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
			});
			httpMock
				.match(() => true)
				.forEach((req) => {
					req.flush({ data: [], total: 0, page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT, totalPages: 0 });
				});
		}

		it('should display Show Map toggle button', async () => {
			localStorage.removeItem('gameNights_showMap');
			const { fixture } = await render(GameNights, {
				providers: makeProviders(),
			});
			flushHttp(fixture);

			const toggleBtn = screen.getByRole('button', { name: /map/i });
			expect(toggleBtn).toBeTruthy();
		});

		it('should toggle map visibility when toggle button clicked', async () => {
			localStorage.setItem('gameNights_showMap', 'true');
			const { fixture, detectChanges } = await render(GameNights, {
				providers: makeProviders(),
			});
			flushHttp(fixture);
			detectChanges();

			expect(screen.getByText(/hide map/i)).toBeTruthy();

			const toggleBtn = screen.getByRole('button', { name: /hide map/i });
			fireEvent.click(toggleBtn);
			detectChanges();

			expect(screen.getByText(/show map/i)).toBeTruthy();
		});
	});
});
