import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-level-up-toast',
	host: { class: 'block' },
	imports: [TranslocoDirective],
	templateUrl: './level-up-toast.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelUpToast {
	readonly level = input.required<number>();
	readonly title = input.required<string>();

	readonly visible = signal(true);

	constructor() {
		setTimeout(() => this.visible.set(false), 4000);
	}
}
