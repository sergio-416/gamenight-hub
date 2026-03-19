import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
	faGift,
	faUserPlus,
	faCircleCheck,
	faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { FeaturePageLayout } from "../../components/feature-page-layout/feature-page-layout";

@Component({
	selector: "app-perks",
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: "./perks.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perks {
	readonly faGift = faGift;
	readonly faUserPlus = faUserPlus;
	readonly faCircleCheck = faCircleCheck;
	readonly faUnlock = faUnlock;
}
