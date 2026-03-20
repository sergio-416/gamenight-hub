import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-feature-page-layout',
	imports: [RouterLink, FaIconComponent, TranslocoDirective],
	templateUrl: './feature-page-layout.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePageLayout {
	readonly faChevronLeft = faChevronLeft;
	readonly faChevronRight = faChevronRight;

	readonly #route = inject(ActivatedRoute);

	readonly #currentSegment = toSignal(this.#route.url, { initialValue: [] });

	readonly #currentPath = computed(() => this.#currentSegment()[0]?.path ?? 'perks');

	readonly #orderedRoutes: readonly ['perks', 'xp', 'badges'] = ['perks', 'xp', 'badges'];

	readonly prevRoute = computed(() => {
		const current = this.#currentPath() as 'perks' | 'xp' | 'badges';
		const i = this.#orderedRoutes.indexOf(current);
		return this.#orderedRoutes[(i - 1 + 3) % 3];
	});

	readonly nextRoute = computed(() => {
		const current = this.#currentPath() as 'perks' | 'xp' | 'badges';
		const i = this.#orderedRoutes.indexOf(current);
		return this.#orderedRoutes[(i + 1) % 3];
	});
}
