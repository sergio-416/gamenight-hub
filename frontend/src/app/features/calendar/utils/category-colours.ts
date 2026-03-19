import type { EventCategory } from "@gamenight-hub/shared";

export const CATEGORY_DOT_CLASSES: Record<EventCategory, string> = {
	strategy: "bg-blue-500",
	rpg: "bg-purple-500",
	party: "bg-pink-500",
	classic: "bg-amber-500",
	cooperative: "bg-emerald-500",
	trivia: "bg-cyan-500",
	miniatures: "bg-red-500",
	family: "bg-orange-500",
	other: "bg-slate-400",
} as const;

export const CATEGORY_BORDER_CLASSES: Record<EventCategory, string> = {
	strategy: "border-l-blue-500",
	rpg: "border-l-purple-500",
	party: "border-l-pink-500",
	classic: "border-l-amber-500",
	cooperative: "border-l-emerald-500",
	trivia: "border-l-cyan-500",
	miniatures: "border-l-red-500",
	family: "border-l-orange-500",
	other: "border-l-slate-400",
} as const;

export const CATEGORY_DATE_CLASSES: Record<EventCategory, string> = {
	strategy: "text-blue-600",
	rpg: "text-purple-600",
	party: "text-pink-600",
	classic: "text-amber-600",
	cooperative: "text-emerald-600",
	trivia: "text-cyan-600",
	miniatures: "text-red-600",
	family: "text-orange-600",
	other: "text-slate-500",
} as const;
