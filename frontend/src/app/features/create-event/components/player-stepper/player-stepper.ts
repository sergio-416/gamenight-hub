import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-player-stepper',
	host: { class: 'block' },
	imports: [TranslocoDirective],
	templateUrl: './player-stepper.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerStepper {
	readonly value = input.required<number>();
	readonly min = input<number>(2);
	readonly max = input<number>(100);

	readonly valueChange = output<number>();

	readonly isMin = computed(() => this.value() <= this.min());
	readonly isMax = computed(() => this.value() >= this.max());

	decrement(): void {
		const next = this.value() - 1;
		if (next >= this.min()) {
			this.valueChange.emit(next);
		}
	}

	increment(): void {
		const next = this.value() + 1;
		if (next <= this.max()) {
			this.valueChange.emit(next);
		}
	}
}
