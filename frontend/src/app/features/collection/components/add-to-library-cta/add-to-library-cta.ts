import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
	selector: 'app-add-to-library-cta',
	imports: [TranslocoDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block' },
	templateUrl: './add-to-library-cta.html',
})
export class AddToLibraryCta {
	addClick = output<void>();
}
