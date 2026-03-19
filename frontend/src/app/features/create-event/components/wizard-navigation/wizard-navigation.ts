import {
	ChangeDetectionStrategy,
	Component,
	input,
	output,
} from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";

import type { WizardStep } from "../../models/wizard-state";

@Component({
	selector: "app-wizard-navigation",
	host: { class: "block" },
	imports: [TranslocoDirective],
	templateUrl: "./wizard-navigation.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardNavigation {
	readonly currentStep = input.required<WizardStep>();
	readonly canContinue = input.required<boolean>();
	readonly isSubmitting = input<boolean>(false);

	readonly back = output<void>();
	readonly next = output<void>();
	readonly submit = output<void>();
}
