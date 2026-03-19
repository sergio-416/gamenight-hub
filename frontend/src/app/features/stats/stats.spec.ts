class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

Object.defineProperty(SVGElement.prototype, "getBBox", {
	value: () => ({
		x: 0,
		y: 0,
		width: 100,
		height: 100,
	}),
	configurable: true,
});

vi.stubGlobal(
	"requestAnimationFrame",
	vi.fn((callback: FrameRequestCallback) => {
		return setTimeout(callback, 0) as unknown as number;
	}),
);
vi.stubGlobal(
	"cancelAnimationFrame",
	vi.fn((id: number) => {
		clearTimeout(id);
	}),
);

import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApplicationRef, signal } from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import { AuthService } from "@core/services/auth";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { render, screen } from "@testing-library/angular";
import { ChartComponent } from "ng-apexcharts";
import { Stats } from "./stats";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.spyOn(ChartComponent.prototype as any, "createElement").mockResolvedValue(
	undefined,
);

describe("Stats", () => {
	let httpMock: HttpTestingController;
	let appRef: ApplicationRef;

	const apiUrl = API_CONFIG.baseUrl;

	function makeAuthProvider(
		isLoggedIn = true,
		role = "user",
		userType = "regular",
	) {
		return {
			provide: AuthService,
			useValue: {
				isLoggedIn: signal(isLoggedIn).asReadonly(),
				userRole: signal(role).asReadonly(),
				userType: signal(userType).asReadonly(),
			},
		};
	}

	async function renderStats(
		isLoggedIn = true,
		role = "user",
		userType = "regular",
	) {
		const result = await render(Stats, {
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTranslocoTesting(),
				makeAuthProvider(isLoggedIn, role, userType),
			],
		});

		httpMock = result.fixture.debugElement.injector.get(HttpTestingController);
		appRef = result.fixture.debugElement.injector.get(ApplicationRef);
		return result;
	}

	afterEach(() => {
		httpMock.verify();
		vi.clearAllMocks();
	});

	describe("when the user is not authenticated", () => {
		it("should show the unauthenticated page heading", async () => {
			await renderStats(false);
			expect(
				screen.getByRole("heading", { name: /your collection insights/i }),
			).toBeTruthy();
		});

		it("should show a sign in link", async () => {
			await renderStats(false);
			expect(screen.getByRole("link", { name: /sign in/i })).toBeTruthy();
		});

		it("should show a create account link", async () => {
			await renderStats(false);
			expect(
				screen.getByRole("link", { name: /create an account/i }),
			).toBeTruthy();
		});

		it("should not render the stats dashboard", async () => {
			await renderStats(false);
			expect(screen.queryByTestId("stats-dashboard")).toBeFalsy();
			expect(screen.queryByText(/loading statistics/i)).toBeFalsy();
		});
	});

	describe("when the user is authenticated", () => {
		describe("display stats dashboard", () => {
			it("should render statistics dashboard when component loads", async () => {
				const { fixture } = await renderStats();
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				expect(req.request.method).toBe("GET");
				req.flush({
					gamesByCategory: [],
					complexityDistribution: [],
					collectionGrowth: [],
					totalGames: 0,
				});

				await appRef.whenStable();

				expect(screen.getByTestId("stats-dashboard")).toBeTruthy();
			});

			it("should fetch stats from backend on init", async () => {
				const mockStats = {
					gamesByCategory: [
						{ name: "Strategy", value: 5 },
						{ name: "Family", value: 3 },
					],
					complexityDistribution: [
						{ name: "1 - Light", value: 2 },
						{ name: "3 - Medium", value: 4 },
					],
					collectionGrowth: [
						{ x: "2024-01", y: 1 },
						{ x: "2024-02", y: 3 },
					],
					totalGames: 10,
				};

				const { fixture } = await renderStats();
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				req.flush(mockStats);

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("games-by-category-chart")).toBeTruthy();
				expect(screen.getByTestId("collection-growth-chart")).toBeTruthy();
				expect(
					screen.getByTestId("complexity-distribution-chart"),
				).toBeTruthy();
			});

			it("should display charts when stats data exists", async () => {
				const mockStats = {
					gamesByCategory: [{ name: "Strategy", value: 5 }],
					complexityDistribution: [{ name: "3 - Medium", value: 4 }],
					collectionGrowth: [{ x: "2024-01", y: 2 }],
					totalGames: 5,
				};

				const { fixture } = await renderStats();
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				req.flush(mockStats);

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("games-by-category-chart")).toBeTruthy();
				expect(screen.getByTestId("collection-growth-chart")).toBeTruthy();
				expect(
					screen.getByTestId("complexity-distribution-chart"),
				).toBeTruthy();
			});

			it("should display loading state while fetching data", async () => {
				const { fixture } = await renderStats();
				fixture.detectChanges();

				expect(screen.getByText("Loading statistics...")).toBeTruthy();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				req.flush({
					gamesByCategory: [],
					complexityDistribution: [],
					collectionGrowth: [],
					totalGames: 0,
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.queryByText("Loading statistics...")).toBeNull();
			});

			it("should display empty state when no games exist", async () => {
				const { fixture } = await renderStats();
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				req.flush({
					gamesByCategory: [],
					complexityDistribution: [],
					collectionGrowth: [],
					totalGames: 0,
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByText(/No statistics yet/)).toBeTruthy();
			});

			it("should handle error when fetching stats fails", async () => {
				const { fixture } = await renderStats();
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/games/stats`);
				req.error(new ProgressEvent("error"), {
					status: 500,
					statusText: "Server Error",
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByRole("alert")).toBeTruthy();
			});
		});
	});

	describe("role-based stats views", () => {
		describe("store_organiser view", () => {
			it("should show organiser stats view for store_organiser users", async () => {
				const { fixture } = await renderStats(true, "user", "store_organiser");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/organiser`);
				req.flush({
					eventsHosted: 5,
					totalAttendees: 40,
					popularGames: [],
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("organiser-stats")).toBeTruthy();
			});

			it("should show organiser metrics: events hosted, total attendees, popular games", async () => {
				const { fixture } = await renderStats(true, "user", "store_organiser");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/organiser`);
				req.flush({
					eventsHosted: 12,
					totalAttendees: 96,
					popularGames: [
						{ name: "Catan", eventCount: 5 },
						{ name: "Pandemic", eventCount: 3 },
					],
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("organiser-events-hosted")).toBeTruthy();
				expect(screen.getByTestId("organiser-total-attendees")).toBeTruthy();
				expect(screen.getByTestId("organiser-popular-games")).toBeTruthy();
			});

			it("should show loading state while fetching organiser stats", async () => {
				const { fixture } = await renderStats(true, "user", "store_organiser");
				fixture.detectChanges();

				expect(screen.getByText(/loading/i)).toBeTruthy();

				const req = httpMock.expectOne(`${apiUrl}/stats/organiser`);
				req.flush({ eventsHosted: 0, totalAttendees: 0, popularGames: [] });

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.queryByText("Loading statistics...")).toBeNull();
			});

			it("should show error state if organiser stats fail", async () => {
				const { fixture } = await renderStats(true, "user", "store_organiser");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/organiser`);
				req.error(new ProgressEvent("error"), {
					status: 500,
					statusText: "Server Error",
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByRole("alert")).toBeTruthy();
			});
		});

		describe("admin view", () => {
			it("should show admin stats view for admin users", async () => {
				const { fixture } = await renderStats(true, "admin", "regular");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/admin`);
				req.flush({
					totalUsers: 100,
					totalEvents: 50,
					totalGames: 200,
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("admin-stats")).toBeTruthy();
			});

			it("should show admin metrics: total users, total events, total games", async () => {
				const { fixture } = await renderStats(true, "admin", "regular");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/admin`);
				req.flush({
					totalUsers: 500,
					totalEvents: 120,
					totalGames: 1000,
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByTestId("admin-total-users")).toBeTruthy();
				expect(screen.getByTestId("admin-total-events")).toBeTruthy();
				expect(screen.getByTestId("admin-total-games")).toBeTruthy();
			});

			it("should show loading state while fetching admin stats", async () => {
				const { fixture } = await renderStats(true, "admin", "regular");
				fixture.detectChanges();

				expect(screen.getByText(/loading/i)).toBeTruthy();

				const req = httpMock.expectOne(`${apiUrl}/stats/admin`);
				req.flush({ totalUsers: 0, totalEvents: 0, totalGames: 0 });

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.queryByText("Loading statistics...")).toBeNull();
			});

			it("should show error state if admin stats fail", async () => {
				const { fixture } = await renderStats(true, "admin", "regular");
				fixture.detectChanges();

				const req = httpMock.expectOne(`${apiUrl}/stats/admin`);
				req.error(new ProgressEvent("error"), {
					status: 500,
					statusText: "Server Error",
				});

				await appRef.whenStable();
				fixture.detectChanges();

				expect(screen.getByRole("alert")).toBeTruthy();
			});
		});
	});
});
