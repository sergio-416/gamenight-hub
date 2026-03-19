import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { OrganiserService } from "@core/services/organiser.service";
import { OrganiserRequestSchema } from "@gamenight-hub/shared";

@Component({
	selector: "app-register-organiser",
	imports: [RouterLink, TranslocoDirective],
	templateUrl: "./register-organiser.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterOrganiser {
	readonly #organiserService = inject(OrganiserService);
	readonly #router = inject(Router);

	readonly #loading = signal(false);
	readonly #orgName = signal("");
	readonly #address = signal("");
	readonly #email = signal("");
	readonly #error = signal<string | null>(null);
	readonly #showSuccess = signal(false);

	readonly isLoading = this.#loading.asReadonly();
	readonly orgName = this.#orgName.asReadonly();
	readonly address = this.#address.asReadonly();
	readonly email = this.#email.asReadonly();
	readonly error = this.#error.asReadonly();
	readonly showSuccess = this.#showSuccess.asReadonly();

	async submit(): Promise<void> {
		this.#loading.set(true);
		this.#error.set(null);

		const result = OrganiserRequestSchema.safeParse({
			orgName: this.#orgName(),
			address: this.#address(),
			email: this.#email(),
		});

		if (!result.success) {
			this.#error.set(result.error.issues[0]?.message ?? "Invalid input");
			this.#loading.set(false);
			return;
		}

		try {
			await this.#organiserService.submitRequest(result.data);
			this.#showSuccess.set(true);
		} catch {
			this.#error.set("Something went wrong. Please try again.");
		} finally {
			this.#loading.set(false);
		}
	}

	async dismissAndRedirect(): Promise<void> {
		this.#showSuccess.set(false);
		await this.#router.navigate(["/home"]);
	}

	onOrgNameChange(event: Event): void {
		this.#orgName.set((event.target as HTMLInputElement).value);
	}

	onAddressChange(event: Event): void {
		this.#address.set((event.target as HTMLInputElement).value);
	}

	onEmailChange(event: Event): void {
		this.#email.set((event.target as HTMLInputElement).value);
	}
}
