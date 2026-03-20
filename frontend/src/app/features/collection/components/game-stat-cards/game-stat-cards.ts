import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-game-stat-cards',
	imports: [TranslocoDirective],
	host: { class: 'block' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './game-stat-cards.html',
})
export class GameStatCards {
	complexity = input<number | null>(null);
	rating = input<number | null>(null);
	rank = input<number | null>(null);
	weightLabel = input<string>('Not rated');
}
