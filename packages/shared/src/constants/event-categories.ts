import type { EventCategory } from '../schemas/event.js';

interface CategoryMeta {
	label: string;
	colorClass: string;
	iconName: string;
}

export const EVENT_CATEGORY_LIST: {
	value: EventCategory;
	label: string;
}[] = [
	{ value: 'strategy', label: 'Strategy' },
	{ value: 'rpg', label: 'RPG' },
	{ value: 'party', label: 'Party' },
	{ value: 'classic', label: 'Classic' },
	{ value: 'cooperative', label: 'Cooperative' },
	{ value: 'trivia', label: 'Trivia' },
	{ value: 'miniatures', label: 'Miniatures' },
	{ value: 'family', label: 'Family' },
	{ value: 'other', label: 'Other' },
] as const;

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
	strategy: {
		label: 'Strategy',
		colorClass: 'bg-blue-100 text-blue-800',
		iconName: 'faChess',
	},
	rpg: {
		label: 'RPG',
		colorClass: 'bg-purple-100 text-purple-800',
		iconName: 'faDragon',
	},
	party: {
		label: 'Party',
		colorClass: 'bg-pink-100 text-pink-800',
		iconName: 'faGlassCheers',
	},
	classic: {
		label: 'Classic',
		colorClass: 'bg-amber-100 text-amber-800',
		iconName: 'faCrown',
	},
	cooperative: {
		label: 'Cooperative',
		colorClass: 'bg-emerald-100 text-emerald-800',
		iconName: 'faHandshake',
	},
	trivia: {
		label: 'Trivia',
		colorClass: 'bg-cyan-100 text-cyan-800',
		iconName: 'faLightbulb',
	},
	miniatures: {
		label: 'Miniatures',
		colorClass: 'bg-red-100 text-red-800',
		iconName: 'faChessKnight',
	},
	family: {
		label: 'Family',
		colorClass: 'bg-orange-100 text-orange-800',
		iconName: 'faUsers',
	},
	other: {
		label: 'Other',
		colorClass: 'bg-slate-100 text-slate-800',
		iconName: 'faPuzzlePiece',
	},
};
