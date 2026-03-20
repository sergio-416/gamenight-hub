import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-collection-header',
	imports: [TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	templateUrl: './collection-header.html',
})
export class CollectionHeader {
	totalGames = input(0);
	isLoggedIn = input(false);
	addGameClick = output<void>();
}
