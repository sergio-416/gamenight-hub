import { TIER_THRESHOLDS } from '@gamenight-hub/shared';

export interface TierColors {
	bg: string;
	ring: string;
	text: string;
	bar: string;
	pill: string;
}

export function getTierColors(level: number): TierColors {
	if (level >= TIER_THRESHOLDS.MASTER)
		return {
			bg: 'bg-purple-500',
			ring: 'ring-purple-300',
			text: 'text-purple-600',
			bar: 'bg-purple-500',
			pill: 'bg-purple-100 text-purple-700',
		};
	if (level >= TIER_THRESHOLDS.ADVANCED)
		return {
			bg: 'bg-amber-500',
			ring: 'ring-amber-300',
			text: 'text-amber-600',
			bar: 'bg-amber-500',
			pill: 'bg-amber-100 text-amber-700',
		};
	if (level >= TIER_THRESHOLDS.INTERMEDIATE)
		return {
			bg: 'bg-indigo-500',
			ring: 'ring-indigo-300',
			text: 'text-indigo-600',
			bar: 'bg-indigo-500',
			pill: 'bg-indigo-100 text-indigo-700',
		};
	return {
		bg: 'bg-emerald-500',
		ring: 'ring-emerald-300',
		text: 'text-emerald-600',
		bar: 'bg-emerald-500',
		pill: 'bg-emerald-100 text-emerald-700',
	};
}
