import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faGift, faUnlock, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { FeaturePageLayout } from '../../components/feature-page-layout/feature-page-layout';

@Component({
	selector: 'app-perks',
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: './perks.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perks {
	readonly faGift = faGift;
	readonly faUserPlus = faUserPlus;
	readonly faCircleCheck = faCircleCheck;
	readonly faUnlock = faUnlock;
}
