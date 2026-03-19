import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";

import type { WizardStep } from "../../models/wizard-state";

@Component({
	selector: "app-wizard-step-indicator",
	host: { class: "block" },
	imports: [TranslocoDirective],
	templateUrl: "./wizard-step-indicator.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepIndicator {
	readonly currentStep = input.required<WizardStep>();
	readonly totalSteps = input<number>(3);

	readonly steps = computed(() =>
		Array.from({ length: this.totalSteps() }, (_, i) => i + 1),
	);
}
