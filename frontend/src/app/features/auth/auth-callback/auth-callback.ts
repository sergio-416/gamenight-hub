import {
	ChangeDetectionStrategy,
	Component,
	inject,
	type OnInit,
	signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService, translateAuthError } from "@core/services/auth";
import { TranslocoDirective } from "@jsverse/transloco";
import { z } from "zod";

type CallbackState = "loading" | "prompt" | "error";

const EmailSchema = z.object({ email: z.email() });

@Component({
	selector: "app-auth-callback",
	imports: [RouterLink, TranslocoDirective],
	templateUrl: "./auth-callback.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
	readonly #authService = inject(AuthService);
	readonly #router = inject(Router);

	readonly #state = signal<CallbackState>("loading");
	readonly #errorMessage = signal<string | null>(null);
	readonly #promptEmail = signal("");

	readonly state = this.#state.asReadonly();
	readonly errorMessage = this.#errorMessage.asReadonly();
	readonly promptEmail = this.#promptEmail.asReadonly();

	async ngOnInit(): Promise<void> {
		const email = localStorage.getItem("emailForSignIn");
		if (!email) {
			this.#state.set("prompt");
			return;
		}
		await this.#complete(email);
	}

	async confirmEmail(): Promise<void> {
		const result = EmailSchema.safeParse({ email: this.#promptEmail() });
		if (!result.success) return;
		await this.#complete(result.data.email);
	}

	onPromptEmailChange(event: Event): void {
		this.#promptEmail.set((event.target as HTMLInputElement).value);
	}

	async #complete(email: string): Promise<void> {
		this.#state.set("loading");
		try {
			const { isNewUser } = await this.#authService.completeSignInWithLink(
				email,
				window.location.href,
			);
			localStorage.removeItem("emailForSignIn");
			await this.#router.navigate([isNewUser ? "/profile/setup" : "/home"]);
		} catch (error: unknown) {
			this.#state.set("error");
			this.#errorMessage.set(translateAuthError(error));
		}
	}
}
