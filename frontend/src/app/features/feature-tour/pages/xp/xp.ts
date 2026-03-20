import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendarCheck, faDice, faStar, faUser } from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { FeaturePageLayout } from '../../components/feature-page-layout/feature-page-layout';

@Component({
	selector: 'app-xp',
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: './xp.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Xp {
	readonly faStar = faStar;
	readonly faDice = faDice;
	readonly faCalendarCheck = faCalendarCheck;
	readonly faUser = faUser;
}
