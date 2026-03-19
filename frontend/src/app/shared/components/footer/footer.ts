import { NgOptimizedImage } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
	selector: "app-footer",
	imports: [RouterLink, NgOptimizedImage, TranslocoDirective],
	templateUrl: "./footer.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
	readonly currentYear = new Date().getFullYear();
}
