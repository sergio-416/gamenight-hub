import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { authGuard } from './core/guards/auth.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';
import { statsGuard } from './core/guards/stats.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
	{ path: '', redirectTo: '/home', pathMatch: 'full' },
	{
		path: 'home',
		loadComponent: () => import('./features/home/home').then((m) => m.Home),
		providers: [provideTranslocoScope('home')],
	},
	{
		path: 'collection',
		loadComponent: () => import('./features/collection/collection').then((m) => m.Collection),
		providers: [provideTranslocoScope('collection')],
	},
	{
		path: 'collection/import',
		canActivate: [authGuard, profileCompleteGuard],
		loadComponent: () =>
			import('./features/collection/components/import-game/import-game').then((m) => m.ImportGame),
		providers: [provideTranslocoScope('collection')],
	},
	{
		path: 'collection/bgg/:bggId',
		canActivate: [authGuard, profileCompleteGuard],
		loadComponent: () =>
			import('./features/collection/components/bgg-game-preview/bgg-game-preview').then(
				(m) => m.BggGamePreview,
			),
		providers: [provideTranslocoScope('collection')],
	},
	{
		path: 'collection/:id',
		loadComponent: () =>
			import('./features/collection/components/game-detail/game-detail').then((m) => m.GameDetail),
		providers: [provideTranslocoScope('collection')],
	},
	{
		path: 'game-nights',
		loadComponent: () => import('./features/game-nights/game-nights').then((m) => m.GameNights),
		providers: [provideTranslocoScope('game-nights')],
	},
	{
		path: 'calendar',
		loadComponent: () => import('./features/calendar/calendar').then((m) => m.Calendar),
		providers: [provideTranslocoScope('calendar')],
	},
	{
		path: 'profile/setup',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/profile/profile-setup/profile-setup').then((m) => m.ProfileSetup),
		providers: [provideTranslocoScope('profile')],
	},
	{
		path: 'profile/me',
		canActivate: [authGuard, profileCompleteGuard],
		loadComponent: () =>
			import('./features/profile/profile-me/profile-me').then((m) => m.ProfileMe),
		providers: [provideTranslocoScope('profile')],
	},
	{
		path: 'profile/:username/collection',
		loadComponent: () =>
			import('./features/profile/profile-public-collection/profile-public-collection').then(
				(m) => m.ProfilePublicCollection,
			),
		providers: [provideTranslocoScope('profile')],
	},
	{
		path: 'profile/:username',
		loadComponent: () =>
			import('./features/profile/profile-public/profile-public').then((m) => m.ProfilePublic),
		providers: [provideTranslocoScope('profile')],
	},
	{
		path: 'stats',
		canActivate: [authGuard, profileCompleteGuard, statsGuard],
		loadComponent: () => import('./features/stats/stats').then((m) => m.Stats),
		providers: [provideTranslocoScope('stats')],
	},
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
		providers: [provideTranslocoScope('auth')],
	},
	{
		path: 'auth/waiting',
		loadComponent: () =>
			import('./features/auth/auth-waiting/auth-waiting').then((m) => m.AuthWaiting),
		providers: [provideTranslocoScope('auth')],
	},
	{
		path: 'auth/callback',
		loadComponent: () =>
			import('./features/auth/auth-callback/auth-callback').then((m) => m.AuthCallback),
		providers: [provideTranslocoScope('auth')],
	},
	{
		path: 'verify-email',
		redirectTo: '/auth/callback',
		pathMatch: 'full',
	},
	{
		path: 'register/organiser',
		loadComponent: () =>
			import('./features/auth/register-organiser/register-organiser').then(
				(m) => m.RegisterOrganiser,
			),
		providers: [
			provideTranslocoScope('auth'),
			provideFirestore(() => getFirestore()),
		],
	},
	{
		path: 'create-event',
		canActivate: [authGuard, profileCompleteGuard],
		canDeactivate: [unsavedChangesGuard],
		loadComponent: () => import('./features/create-event/create-event').then((m) => m.CreateEvent),
		providers: [provideTranslocoScope('create-event')],
	},
	{
		path: 'events/:id',
		loadComponent: () =>
			import('./features/events/event-detail/event-detail').then((m) => m.EventDetail),
		providers: [provideTranslocoScope('events'), provideTranslocoScope('create-event')],
	},
	{
		path: 'features',
		loadChildren: () =>
			import('./features/feature-tour/feature-tour.routes').then((m) => m.featureTourRoutes),
		providers: [provideTranslocoScope('feature-tour')],
	},
	{
		path: 'offline',
		loadComponent: () =>
			import('./shared/components/offline-fallback/offline-fallback').then(
				(m) => m.OfflineFallback,
			),
	},
	{ path: '**', redirectTo: '/home' },
];
