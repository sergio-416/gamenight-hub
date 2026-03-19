import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth";
import { ProfileService } from "@core/services/profile.service";
import { of } from "rxjs";
import { catchError, map, switchMap, take } from "rxjs/operators";

function isProfileComplete(profile: {
	firstName?: string | null;
	lastName?: string | null;
	username?: string | null;
}): boolean {
	return (
		!!profile.firstName?.trim() &&
		!!profile.lastName?.trim() &&
		!!profile.username?.trim()
	);
}

export const profileCompleteGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const profileService = inject(ProfileService);
	const router = inject(Router);

	return authService.authReady$.pipe(
		take(1),
		switchMap(() => {
			if (!authService.isLoggedIn()) {
				return of(router.createUrlTree(["/login"]));
			}

			const cached = profileService.cachedProfile();
			if (cached !== null) {
				return of(
					isProfileComplete(cached) || router.createUrlTree(["/profile/setup"]),
				);
			}

			return profileService.getMyProfile().pipe(
				map((profile) => {
					if (!isProfileComplete(profile)) {
						return router.createUrlTree(["/profile/setup"]);
					}
					return true;
				}),
				catchError(() => of(router.createUrlTree(["/profile/setup"]))),
			);
		}),
	);
};
