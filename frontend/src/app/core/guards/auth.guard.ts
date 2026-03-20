import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.authReady$.pipe(
		take(1),
		map(() => {
			if (authService.isLoggedIn()) return true;
			return router.createUrlTree(['/login']);
		}),
	);
};
