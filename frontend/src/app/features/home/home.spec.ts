import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { AuthService } from "@core/services/auth";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { render, screen } from "@testing-library/angular";
import { Home } from "./home";

function createMockAuthService(loggedIn = false) {
	return {
		isLoggedIn: signal(loggedIn),
		currentUser: signal(null),
		userRole: signal("user"),
	};
}

describe("Home", () => {
	describe("hero section", () => {
		it("should render hero title", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(
				screen.getByRole("heading", {
					level: 1,
					name: /Ready for your next adventure/,
				}),
			).toBeTruthy();
		});

		it("should render hero subtitle", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(screen.getByText(/Discover local game nights/)).toBeTruthy();
		});

		it("should show Browse Events CTA when logged out", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService(false) },
				],
			});

			const link = screen.getByRole("link", { name: /Browse Events/ });
			expect(link).toBeTruthy();
			expect(link.getAttribute("href")).toBe("/game-nights");
		});

		it("should show Start Exploring and Host Session CTAs when logged in", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService(true) },
				],
			});

			const exploreLink = screen.getByRole("link", {
				name: /Start Exploring/,
			});
			expect(exploreLink).toBeTruthy();
			expect(exploreLink.getAttribute("href")).toBe("/game-nights");

			const hostLink = screen.getByRole("link", { name: /Host Session/ });
			expect(hostLink).toBeTruthy();
			expect(hostLink.getAttribute("href")).toBe("/calendar");
		});

		it("should not show Host Session when logged out", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService(false) },
				],
			});

			expect(screen.queryByRole("link", { name: /Host Session/ })).toBeNull();
		});
	});

	describe("feature cards", () => {
		it("should display feature cards with correct titles", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(screen.getByText("Member Perks")).toBeTruthy();
			expect(screen.getByText("XP & Levels")).toBeTruthy();
			expect(screen.getByText("Achievements")).toBeTruthy();
		});

		it("should render three feature cards with correct descriptions", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(screen.getByText(/Unlock exclusive benefits/)).toBeTruthy();
			expect(screen.getByText(/Earn experience points/)).toBeTruthy();
			expect(screen.getByText(/Collect badges/)).toBeTruthy();
		});

		it("should render Learn more links to feature tour pages", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			const links = screen.getAllByRole("link", { name: /Learn more/ });
			const hrefs = links.map((l) => l.getAttribute("href"));
			expect(hrefs).toContain("/features/perks");
			expect(hrefs).toContain("/features/xp");
			expect(hrefs).toContain("/features/badges");
		});
	});

	describe("support strip", () => {
		it("should render support strip title", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(screen.getByText(/Need assistance, Traveler/)).toBeTruthy();
		});

		it("should render Support Hub and Community Rules links", async () => {
			await render(Home, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: AuthService, useValue: createMockAuthService() },
				],
			});

			expect(screen.getByRole("link", { name: /Support Hub/ })).toBeTruthy();
			expect(
				screen.getByRole("link", { name: /Community Rules/ }),
			).toBeTruthy();
		});
	});
});
