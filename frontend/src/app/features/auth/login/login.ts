import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { AuthService, translateAuthError } from "@core/services/auth";
import { z } from "zod";

const EmailSchema = z.object({
	email: z.email("Please enter a valid email address."),
});

@Component({
	selector: "app-login",
	imports: [RouterLink, TranslocoDirective],
	templateUrl: "./login.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
	readonly #authService = inject(AuthService);
	readonly #router = inject(Router);
	readonly #googleLoading = signal(false);
	readonly #emailLoading = signal(false);
	readonly #email = signal("");
	readonly #error = signal<string | null>(null);

	readonly isGoogleLoading = this.#googleLoading.asReadonly();
	readonly isEmailLoading = this.#emailLoading.asReadonly();
	readonly email = this.#email.asReadonly();
	readonly error = this.#error.asReadonly();

	async loginWithGoogle(): Promise<void> {
		this.#googleLoading.set(true);
		this.#error.set(null);
		try {
			const { isNewUser } = await this.#authService.login();
			await this.#router.navigate([isNewUser ? "/profile/setup" : "/home"]);
		} catch (error: unknown) {
			this.#error.set(translateAuthError(error));
		} finally {
			this.#googleLoading.set(false);
		}
	}

	async sendLink(): Promise<void> {
		this.#error.set(null);

		const result = EmailSchema.safeParse({ email: this.#email() });
		if (!result.success) {
			this.#error.set(
				result.error.issues[0]?.message ??
					"Please enter a valid email address.",
			);
			return;
		}

		this.#emailLoading.set(true);
		try {
			await this.#authService.sendSignInLink(result.data.email);
			await this.#router.navigate(["/auth/waiting"]);
		} catch (error: unknown) {
			this.#error.set(translateAuthError(error));
		} finally {
			this.#emailLoading.set(false);
		}
	}

	onEmailChange(event: Event): void {
		this.#email.set((event.target as HTMLInputElement).value);
	}
}
