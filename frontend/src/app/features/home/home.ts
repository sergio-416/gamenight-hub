import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
	faArrowRight,
	faCalendarCheck,
	faCompass,
	faGift,
	faHeadset,
	faMedal,
	faPlus,
	faScroll,
	faStar,
	faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "@core/services/auth";

@Component({
	selector: "app-home",
	imports: [
		RouterLink,
		FontAwesomeModule,
		NgOptimizedImage,
		TranslocoDirective,
	],
	templateUrl: "./home.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
	readonly #authService = inject(AuthService);

	readonly isLoggedIn = this.#authService.isLoggedIn;
	readonly compassIcon = faCompass;
	readonly plusIcon = faPlus;
	readonly giftIcon = faGift;
	readonly starIcon = faStar;
	readonly medalIcon = faMedal;
	readonly headsetIcon = faHeadset;
	readonly scrollIcon = faScroll;
	readonly arrowRightIcon = faArrowRight;
	readonly gridIcon = faTableCellsLarge;
	readonly calendarCheckIcon = faCalendarCheck;
}
