import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
	faStar,
	faDice,
	faCalendarCheck,
	faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FeaturePageLayout } from "../../components/feature-page-layout/feature-page-layout";

@Component({
	selector: "app-xp",
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: "./xp.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Xp {
	readonly faStar = faStar;
	readonly faDice = faDice;
	readonly faCalendarCheck = faCalendarCheck;
	readonly faUser = faUser;
}
