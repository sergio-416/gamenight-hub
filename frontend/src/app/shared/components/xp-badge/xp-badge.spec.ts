import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { XpService } from '@shared/services/xp.service';
import { render, screen } from '@testing-library/angular';
import { XpBadge } from './xp-badge';

function makeXpService(
	overrides: {
		profile?: {
			level: number;
			progressPercent: number;
			xpTotal: number;
			nextLevelXp: number;
		} | null;
		loading?: boolean;
	} = {},
) {
	return {
		profile: signal(overrides.profile ?? null),
		profileLoading: signal(overrides.loading ?? false),
		profileError: signal(null),
	};
}

async function renderBadge(xpService: ReturnType<typeof makeXpService>) {
	return render(XpBadge, {
		providers: [
			provideRouter([]),
			provideTranslocoTesting(),
			{ provide: XpService, useValue: xpService },
		],
	});
}

describe('XpBadge', () => {
	it('should not render anything when profile is null', async () => {
		await renderBadge(makeXpService({ profile: null }));

		expect(screen.queryByText(/Lv\./)).toBeNull();
	});

	it('should render the level when profile is loaded', async () => {
		await renderBadge(
			makeXpService({
				profile: {
					level: 3,
					progressPercent: 45,
					xpTotal: 750,
					nextLevelXp: 2000,
				},
			}),
		);

		expect(screen.getByText('Lv.3')).toBeTruthy();
	});

	it('should render the progress bar', async () => {
		await renderBadge(
			makeXpService({
				profile: {
					level: 5,
					progressPercent: 60,
					xpTotal: 3000,
					nextLevelXp: 5000,
				},
			}),
		);

		expect(screen.getByLabelText('XP Level')).toBeTruthy();
	});

	it('should include tooltip text with level details', async () => {
		await renderBadge(
			makeXpService({
				profile: {
					level: 3,
					progressPercent: 45,
					xpTotal: 750,
					nextLevelXp: 2000,
				},
			}),
		);

		const link = screen.getByLabelText('XP Level');
		expect(link.getAttribute('title')).toContain('Level 3');
		expect(link.getAttribute('title')).toContain('Apprentice Archivist');
		expect(link.getAttribute('title')).toContain('750/2000 XP');
	});

	it('should link to the profile page', async () => {
		await renderBadge(
			makeXpService({
				profile: {
					level: 1,
					progressPercent: 10,
					xpTotal: 10,
					nextLevelXp: 100,
				},
			}),
		);

		const link = screen.getByLabelText('XP Level');
		expect(link.getAttribute('href')).toBe('/profile/me#xp');
	});
});
