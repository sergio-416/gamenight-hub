import type { StepGameData, StepLocationData, StepPlayersData } from '../schemas/wizard-validation';

export interface WizardFormData extends StepGameData, StepLocationData, StepPlayersData {}

export type WizardStep = 1 | 2 | 3;

export interface WizardState {
	currentStep: WizardStep;
	formData: Partial<WizardFormData>;
	isSubmitting: boolean;
}

export const INITIAL_WIZARD_STATE: WizardState = {
	currentStep: 1,
	formData: {
		maxPlayers: 4,
		locationMode: 'private',
	},
	isSubmitting: false,
};
