import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar, faDiceD20, faRobot } from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-collection-unauthenticated',
	imports: [RouterLink, FontAwesomeModule, TranslocoDirective],
	templateUrl: './collection-unauthenticated.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionUnauthenticated {
	readonly diceIcon = faDiceD20;
	readonly robotIcon = faRobot;
	readonly chartIcon = faChartBar;
}
