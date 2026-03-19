import type { GameStatus } from "@gamenight-hub/shared";

export const SORT_MODE = {
	NAME_ASC: "name_asc",
	NAME_DESC: "name_desc",
	NEWEST: "newest",
	OLDEST: "oldest",
} as const;

export type SortMode = (typeof SORT_MODE)[keyof typeof SORT_MODE];

export const PLAYER_COUNT_FILTER = {
	ANY: "any",
	ONE: "1",
	TWO: "2",
	THREE: "3",
	FOUR: "4",
	FIVE: "5",
	SIX_PLUS: "6+",
} as const;

export type PlayerCountFilter =
	(typeof PLAYER_COUNT_FILTER)[keyof typeof PLAYER_COUNT_FILTER];

export const VIEW_MODE = {
	GRID: "grid",
	LIST: "list",
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export const STATUS_COLORS: Record<GameStatus, string> = {
	owned: "bg-emerald-100 text-emerald-700",
	want_to_play: "bg-blue-100 text-blue-700",
	want_to_try: "bg-amber-100 text-amber-700",
	played: "bg-slate-100 text-slate-600",
};

export const STATUS_LABELS: Record<string, string> = {
	owned: "Owned",
	want_to_play: "Want to Play",
	want_to_try: "Want to Try",
	played: "Played",
};
