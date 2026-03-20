import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import type { UserRole } from '@gamenight-hub/shared';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
	return () => {
		const authService = inject(AuthService);
		const router = inject(Router);

		if (!authService.isLoggedIn()) {
			return router.createUrlTree(['/login']);
		}

		const role = authService.userRole();

		if (role === 'admin' || role === requiredRole) {
			return true;
		}

		return router.createUrlTree(['/home']);
	};
};
