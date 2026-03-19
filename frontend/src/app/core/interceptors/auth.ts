import { HttpErrorResponse, type HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, switchMap, take, throwError } from "rxjs";
import { AuthService } from "@core/services/auth";
import { ToastService } from "@core/services/toast";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const toast = inject(ToastService);

	return authService.idToken$.pipe(
		take(1),
		switchMap((token) => {
			const request = token
				? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
				: req;

			return next(request).pipe(
				catchError((error: HttpErrorResponse) => {
					if (
						error.status === 404 &&
						error.error?.code === "PROFILE_NOT_FOUND" &&
						req.url.includes("/profile/me")
					) {
						void authService.logout().then(() => {
							toast.info("This account has been deleted.");
							void router.navigate(["/home"]);
						});
					}
					return throwError(() => error);
				}),
			);
		}),
	);
};
