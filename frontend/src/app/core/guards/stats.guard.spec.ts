import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	type ActivatedRouteSnapshot,
	provideRouter,
	type RouterStateSnapshot,
	UrlTree,
} from "@angular/router";
import { AuthService } from "@core/services/auth";
import { statsGuard } from "./stats.guard";

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

function setupWith(isLoggedIn: boolean, role: string, userType: string) {
	const mockAuthService = {
		isLoggedIn: signal(isLoggedIn).asReadonly(),
		userRole: signal(role).asReadonly(),
		userType: signal(userType).asReadonly(),
	};

	TestBed.configureTestingModule({
		providers: [
			provideRouter([]),
			{ provide: AuthService, useValue: mockAuthService },
		],
	});
}

describe("statsGuard", () => {
	it("should allow admin", () => {
		setupWith(true, "admin", "regular");

		const result = TestBed.runInInjectionContext(() =>
			statsGuard(mockRoute, mockState),
		);

		expect(result).toBe(true);
	});

	it("should allow store_organiser", () => {
		setupWith(true, "user", "store_organiser");

		const result = TestBed.runInInjectionContext(() =>
			statsGuard(mockRoute, mockState),
		);

		expect(result).toBe(true);
	});

	it("should redirect user to /home", () => {
		setupWith(true, "user", "regular");

		const result = TestBed.runInInjectionContext(() =>
			statsGuard(mockRoute, mockState),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe("/home");
	});

	// [Mod] Dormant — moderator redirected, no stats view
	it("should redirect moderator to /home", () => {
		setupWith(true, "moderator", "regular");

		const result = TestBed.runInInjectionContext(() =>
			statsGuard(mockRoute, mockState),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe("/home");
	});

	it("should redirect unauthenticated to /login", () => {
		setupWith(false, "user", "regular");

		const result = TestBed.runInInjectionContext(() =>
			statsGuard(mockRoute, mockState),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe("/login");
	});
});
