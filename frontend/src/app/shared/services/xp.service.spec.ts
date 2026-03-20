import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import { XpService } from './xp.service';

const baseUrl = API_CONFIG.baseUrl;

describe('XpService', () => {
	let service: XpService;
	let httpMock: HttpTestingController;
	const isLoggedIn = signal(false);

	beforeEach(() => {
		isLoggedIn.set(false);

		TestBed.configureTestingModule({
			providers: [
				XpService,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AuthService,
					useValue: { isLoggedIn: isLoggedIn.asReadonly() },
				},
			],
		});

		service = TestBed.inject(XpService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock
			.match(() => true)
			.forEach((r) => {
				r.flush({});
			});
		vi.clearAllMocks();
	});

	describe('profile resource', () => {
		it('should expose profile as undefined initially before response', () => {
			expect(service.profile()).toBeUndefined();
		});

		it('should not fetch when user is not logged in', () => {
			expect(service.profileLoading()).toBe(false);
			httpMock.expectNone(`${baseUrl}${API_CONFIG.endpoints.xpProfile}`);
		});
	});

	describe('getHistory', () => {
		it('should fetch paginated history from the API', () => {
			const mockResponse = {
				data: [],
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 0,
			};

			service.getHistory(1, 10).subscribe((res) => {
				expect(res.page).toBe(1);
				expect(res.data).toEqual([]);
			});

			const req = httpMock.expectOne(
				(r) =>
					r.url === `${baseUrl}/xp/me/history` &&
					r.params.get('page') === '1' &&
					r.params.get('limit') === '10',
			);
			expect(req.request.method).toBe('GET');
			req.flush(mockResponse);
		});
	});

	describe('xpFeedback signal', () => {
		it('should start as null', () => {
			expect(service.xpFeedback()).toBeNull();
		});

		it('should set feedback when showXpFeedback is called', () => {
			service.showXpFeedback({
				xpAwarded: 75,
				action: 'game_added',
				levelUp: false,
			});

			expect(service.xpFeedback()).toEqual({
				xpAwarded: 75,
				action: 'game_added',
				levelUp: false,
			});
		});

		it('should auto-clear feedback after 3 seconds', () => {
			vi.useFakeTimers();

			service.showXpFeedback({
				xpAwarded: 50,
				action: 'event_created',
				levelUp: false,
			});

			expect(service.xpFeedback()).not.toBeNull();

			vi.advanceTimersByTime(3000);

			expect(service.xpFeedback()).toBeNull();

			vi.useRealTimers();
		});

		it('should clear feedback immediately with clearFeedback', () => {
			service.showXpFeedback({
				xpAwarded: 100,
				action: 'participant_joined',
				levelUp: true,
				newLevel: 3,
			});

			expect(service.xpFeedback()).not.toBeNull();

			service.clearFeedback();

			expect(service.xpFeedback()).toBeNull();
		});
	});
});
