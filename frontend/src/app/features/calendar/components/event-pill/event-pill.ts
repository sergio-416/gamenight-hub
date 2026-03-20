import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CalendarEvent } from '@gamenight-hub/shared';

@Component({
	selector: 'app-event-pill',
	host: { class: 'block' },
	templateUrl: './event-pill.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPill {
	readonly event = input.required<CalendarEvent>();
	readonly dotClass = input.required<string>();
	readonly pillClick = output<CalendarEvent>();

	onClick(e: Event): void {
		e.stopPropagation();
		this.pillClick.emit(this.event());
	}
}
