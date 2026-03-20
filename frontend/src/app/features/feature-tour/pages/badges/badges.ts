import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBoxOpen, faDice, faMedal, faRocket } from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { FeaturePageLayout } from '../../components/feature-page-layout/feature-page-layout';

@Component({
	selector: 'app-badges',
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: './badges.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badges {
	readonly faMedal = faMedal;
	readonly faRocket = faRocket;
	readonly faDice = faDice;
	readonly faBoxOpen = faBoxOpen;
}
