import type { Routes } from "@angular/router";

export const featureTourRoutes: Routes = [
	{ path: "", redirectTo: "perks", pathMatch: "full" },
	{
		path: "perks",
		loadComponent: () => import("./pages/perks/perks").then((m) => m.Perks),
	},
	{
		path: "xp",
		loadComponent: () => import("./pages/xp/xp").then((m) => m.Xp),
	},
	{
		path: "badges",
		loadComponent: () => import("./pages/badges/badges").then((m) => m.Badges),
	},
];
