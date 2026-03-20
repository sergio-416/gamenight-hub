import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	type OnInit,
	signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@core/services/auth";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
	selector: "app-auth-waiting",
	imports: [RouterLink, TranslocoDirective],
	templateUrl: "./auth-waiting.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthWaiting implements OnInit {
	readonly #authService = inject(AuthService);
	readonly #email = signal<string | null>(null);

	readonly email = this.#email.asReadonly();
	readonly isSignedIn = computed(
		() => this.#authService.currentUser() !== null,
	);

	ngOnInit(): void {
		this.#email.set(localStorage.getItem("emailForSignIn"));
	}
}
