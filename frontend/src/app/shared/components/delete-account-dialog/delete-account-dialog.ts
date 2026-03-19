import { A11yModule } from "@angular/cdk/a11y";
import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	linkedSignal,
	output,
} from "@angular/core";
import { Router } from "@angular/router";
import { ProfileService } from "@core/services/profile.service";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
	faLock,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

@Component({
	selector: "app-delete-account-dialog",
	imports: [A11yModule, FontAwesomeModule],
	templateUrl: "./delete-account-dialog.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { "(keydown.escape)": "onCancel()" },
})
export class DeleteAccountDialog {
	readonly #profileService = inject(ProfileService);
	readonly #router = inject(Router);

	readonly isOpen = input.required<boolean>();
	readonly username = input.required<string>();

	readonly cancelled = output<void>();
	readonly accountDeleted = output<void>();

	readonly step = linkedSignal<boolean, "warning" | "confirm">({
		source: () => this.isOpen(),
		computation: () => "warning",
	});
	readonly checking = linkedSignal({
		source: () => this.isOpen(),
		computation: () => false,
	});
	readonly openEventsCount = linkedSignal({
		source: () => this.isOpen(),
		computation: () => 0,
	});
	readonly hasOpenEvents = computed(() => this.openEventsCount() > 0);
	readonly usernameInput = linkedSignal({
		source: () => this.isOpen(),
		computation: () => "",
	});
	readonly deleting = linkedSignal({
		source: () => this.isOpen(),
		computation: () => false,
	});
	readonly deleteError = linkedSignal<boolean, string | null>({
		source: () => this.isOpen(),
		computation: () => null,
	});

	readonly usernameMatches = computed(() => {
		const u = this.username();
		return u.length > 0 && this.usernameInput() === u;
	});

	readonly iconWarning = faTriangleExclamation;
	readonly iconLock = faLock;

	handleIUnderstand(): void {
		this.checking.set(true);

		this.#profileService.getDeletionEligibility().subscribe({
			next: ({ eligible, openEventsCount }) => {
				this.checking.set(false);
				if (eligible) {
					this.step.set("confirm");
				} else {
					this.openEventsCount.set(openEventsCount);
				}
			},
			error: () => {
				this.checking.set(false);
			},
		});
	}

	confirmDelete(): void {
		if (!this.usernameMatches()) return;
		this.deleting.set(true);
		this.deleteError.set(null);

		this.#profileService.deleteMyAccount().subscribe({
			next: () => {
				this.deleting.set(false);
				this.accountDeleted.emit();
			},
			error: (err: unknown) => {
				this.deleting.set(false);
				if (err instanceof HttpErrorResponse && err.status === 409) {
					this.deleteError.set(
						"You still have open events. Please close them first.",
					);
					this.step.set("warning");
					this.openEventsCount.set(1);
				} else {
					this.deleteError.set("Something went wrong. Please try again.");
				}
			},
		});
	}

	goToEvents(): void {
		this.cancelled.emit();
		void this.#router.navigate(["/game-nights"]);
	}

	onCancel(): void {
		this.cancelled.emit();
	}

	handleBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.cancelled.emit();
		}
	}
}
