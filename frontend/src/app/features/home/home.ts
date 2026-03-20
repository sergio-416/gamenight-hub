import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-home',
	imports: [RouterLink, FontAwesomeModule, NgOptimizedImage, TranslocoDirective],
	templateUrl: './home.html',
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
