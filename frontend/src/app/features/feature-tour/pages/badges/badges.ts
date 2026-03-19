import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslocoDirective } from "@jsverse/transloco";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
	faMedal,
	faRocket,
	faDice,
	faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FeaturePageLayout } from "../../components/feature-page-layout/feature-page-layout";

@Component({
	selector: "app-badges",
	imports: [FeaturePageLayout, FaIconComponent, TranslocoDirective],
	templateUrl: "./badges.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badges {
	readonly faMedal = faMedal;
	readonly faRocket = faRocket;
	readonly faDice = faDice;
	readonly faBoxOpen = faBoxOpen;
}
