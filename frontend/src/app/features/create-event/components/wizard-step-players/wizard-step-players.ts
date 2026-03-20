import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { InfoTooltip } from '@shared/components/info-tooltip/info-tooltip';
import { PlayerStepper } from '../player-stepper/player-stepper';

@Component({
	selector: 'app-wizard-step-players',
	imports: [PlayerStepper, InfoTooltip, TranslocoDirective],
	templateUrl: './wizard-step-players.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepPlayers {
	readonly maxPlayers = input.required<number>();
	readonly gameMinPlayers = input<number | undefined>();
	readonly gameMaxPlayers = input<number | undefined>();

	readonly maxPlayersChange = output<number>();

	readonly playerRangeHint = computed(() => {
		const min = this.gameMinPlayers();
		const max = this.gameMaxPlayers();
		if (!min && !max) return null;
		if (min && max) return `${min}–${max} players`;
		if (min) return `${min}+ players`;
		return `Up to ${max} players`;
	});

	readonly playerRangeWarning = computed(() => {
		const max = this.gameMaxPlayers();
		const min = this.gameMinPlayers();
		const current = this.maxPlayers();
		if (max && current > max) {
			return `This game supports up to ${max} players — your event allows ${current}`;
		}
		if (min && current < min) {
			return `This game requires at least ${min} players — your event allows ${current}`;
		}
		return null;
	});
}
