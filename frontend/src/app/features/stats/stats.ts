import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import { AuthService } from '@core/services/auth';
import type { AdminStatsDto, OrganiserStatsDto } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { StatsUnauthenticated } from '@stats/components/stats-unauthenticated/stats-unauthenticated';
import type { ChartOptions, StatsData } from '@stats/stats.types';
import { ChartComponent } from 'ng-apexcharts';

@Component({
	selector: 'app-stats',
	imports: [ChartComponent, StatsUnauthenticated, TranslocoDirective],
	templateUrl: './stats.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stats {
	readonly #apiUrl = API_CONFIG.baseUrl;
	readonly #authService = inject(AuthService);
	readonly #transloco = inject(TranslocoService);

	readonly isLoggedIn = this.#authService.isLoggedIn;
	readonly #userRole = this.#authService.userRole;
	readonly #userType = this.#authService.userType;

	readonly view = computed<'organiser' | 'admin' | 'games'>(() => {
		if (this.#userRole() === 'admin') return 'admin';
		if (this.#userType() === 'store_organiser') return 'organiser';
		return 'games';
	});

	readonly statsResource = httpResource<StatsData>(() =>
		this.isLoggedIn() && this.view() === 'games' ? `${this.#apiUrl}/games/stats` : undefined,
	);

	readonly organiserStatsResource = httpResource<OrganiserStatsDto>(() =>
		this.isLoggedIn() && this.view() === 'organiser'
			? `${this.#apiUrl}/stats/organiser`
			: undefined,
	);

	readonly adminStatsResource = httpResource<AdminStatsDto>(() =>
		this.isLoggedIn() && this.view() === 'admin' ? `${this.#apiUrl}/stats/admin` : undefined,
	);

	readonly gamesByCategoryData = computed(() => this.statsResource.value()?.gamesByCategory ?? []);
	readonly complexityDistributionData = computed(
		() => this.statsResource.value()?.complexityDistribution ?? [],
	);
	readonly collectionGrowthData = computed(
		() => this.statsResource.value()?.collectionGrowth ?? [],
	);
	readonly totalGames = computed(() => this.statsResource.value()?.totalGames ?? 0);

	readonly gamesByCategoryOptions = computed<ChartOptions>(() => ({
		series: [
			{
				name: 'Games',
				data: this.gamesByCategoryData().map((item) => item.value),
			},
		],
		chart: { type: 'bar', height: 350 },
		title: {
			text: this.#transloco.translate('stats.collection.charts.gamesByCategory'),
		},
		xaxis: { categories: this.gamesByCategoryData().map((item) => item.name) },
	}));

	readonly collectionGrowthOptions = computed<ChartOptions>(() => ({
		series: [{ name: 'Total Games', data: this.collectionGrowthData() }],
		chart: { type: 'line', height: 350 },
		title: {
			text: this.#transloco.translate('stats.collection.charts.collectionGrowth'),
		},
		xaxis: { type: 'datetime' },
	}));

	readonly complexityDistributionOptions = computed<ChartOptions>(() => ({
		series: this.complexityDistributionData().map((item) => item.value),
		chart: { type: 'pie', height: 350 },
		title: {
			text: this.#transloco.translate('stats.collection.charts.complexityDistribution'),
		},
		labels: this.complexityDistributionData().map((item) => item.name),
	}));
}
