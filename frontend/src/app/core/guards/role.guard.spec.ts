import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	type ActivatedRouteSnapshot,
	provideRouter,
	type RouterStateSnapshot,
	UrlTree,
} from "@angular/router";
import { AuthService } from "@core/services/auth";
import { roleGuard } from "./role.guard";

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

function setupWithRole(isLoggedIn: boolean, role: string) {
	const isLoggedInSignal = signal(isLoggedIn);
	const userRoleSignal = signal(role);

	const mockAuthService = {
		isLoggedIn: isLoggedInSignal.asReadonly(),
		userRole: userRoleSignal.asReadonly(),
	};

	TestBed.configureTestingModule({
		providers: [
			provideRouter([]),
			{ provide: AuthService, useValue: mockAuthService },
		],
	});

	return { mockAuthService };
}

describe("roleGuard", () => {
	it("should allow access when user has the required role", () => {
		setupWithRole(true, "moderator");

		const result = TestBed.runInInjectionContext(() =>
			roleGuard("moderator")(mockRoute, mockState),
		);

		expect(result).toBe(true);
	});

	it("should allow admin access to any role-protected route", () => {
		setupWithRole(true, "admin");

		const result = TestBed.runInInjectionContext(() =>
			roleGuard("moderator")(mockRoute, mockState),
		);

		expect(result).toBe(true);
	});

	it("should redirect to /login when user is not authenticated", () => {
		setupWithRole(false, "user");

		const result = TestBed.runInInjectionContext(() =>
			roleGuard("moderator")(mockRoute, mockState),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe("/login");
	});

	it("should redirect to /home when authenticated but lacking the required role", () => {
		setupWithRole(true, "user");

		const result = TestBed.runInInjectionContext(() =>
			roleGuard("moderator")(mockRoute, mockState),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe("/home");
	});
});
