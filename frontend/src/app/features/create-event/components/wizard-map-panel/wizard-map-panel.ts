import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SimpleMapPreview } from '@shared/components/simple-map-preview/simple-map-preview';

@Component({
	selector: 'app-wizard-map-panel',
	imports: [SimpleMapPreview, TranslocoDirective],
	templateUrl: './wizard-map-panel.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardMapPanel {
	readonly latitude = input<number | undefined>();
	readonly longitude = input<number | undefined>();
	readonly locationName = input<string | undefined>();

	readonly hasLocation = computed(
		() => this.latitude() !== undefined && this.longitude() !== undefined,
	);
}
