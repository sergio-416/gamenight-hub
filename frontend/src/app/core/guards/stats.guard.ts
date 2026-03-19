import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth";

export const statsGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if (!authService.isLoggedIn()) {
		return router.createUrlTree(["/login"]);
	}

	const role = authService.userRole();
	const userType = authService.userType();

	if (role === "admin" || userType === "store_organiser") {
		return true;
	}

	return router.createUrlTree(["/home"]);
};
