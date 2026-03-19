import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
	faChartBar,
	faChartLine,
	faChartPie,
} from "@fortawesome/free-solid-svg-icons";

@Component({
	selector: "app-stats-unauthenticated",
	imports: [RouterLink, FontAwesomeModule, TranslocoDirective],
	templateUrl: "./stats-unauthenticated.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsUnauthenticated {
	readonly barChartIcon = faChartBar;
	readonly lineChartIcon = faChartLine;
	readonly pieChartIcon = faChartPie;
}
