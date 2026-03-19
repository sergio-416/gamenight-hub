import { NgOptimizedImage } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
} from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { TranslocoDirective } from "@jsverse/transloco";
import { AuthService } from "@core/services/auth";
import { CvdSelector } from "@shared/components/cvd-selector/cvd-selector";
import { LanguageSwitcher } from "@shared/components/language-switcher/language-switcher";
import { ThemeToggle } from "@shared/components/theme-toggle/theme-toggle";
import { XpService } from "@shared/services/xp.service";

@Component({
	selector: "app-header",
	imports: [
		RouterLink,
		RouterLinkActive,
		NgOptimizedImage,
		FaIconComponent,
		TranslocoDirective,
		CvdSelector,
		LanguageSwitcher,
		ThemeToggle,
	],
	templateUrl: "./header.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
	readonly faBell = faBell;
	readonly #authService = inject(AuthService);
	readonly #xpService = inject(XpService);
	readonly #mobileMenuOpen = signal(false);
	readonly #router = inject(Router);

	readonly isLoggedIn = this.#authService.isLoggedIn;
	readonly userRole = this.#authService.userRole;
	readonly canSeeStats = computed(() => {
		const role = this.#authService.userRole();
		return role === "admin" || role === "moderator";
	});
	readonly userAvatar = computed(
		() => this.#authService.currentUser()?.photoURL ?? null,
	);
	readonly userLevel = computed(() => this.#xpService.profile()?.level ?? 0);
	readonly isMobileMenuOpen = this.#mobileMenuOpen.asReadonly();

	toggleMobileMenu(): void {
		this.#mobileMenuOpen.update((open) => !open);
	}

	closeMobileMenu(): void {
		this.#mobileMenuOpen.set(false);
	}

	async login(): Promise<void> {
		await this.#router.navigate(["/login"]);
	}
}
