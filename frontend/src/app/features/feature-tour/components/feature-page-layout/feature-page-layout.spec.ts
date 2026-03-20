import { ActivatedRoute, provideRouter, UrlSegment } from '@angular/router';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';
import { FeaturePageLayout } from './feature-page-layout';

function makeRoute(segment: string) {
	const url$ = new BehaviorSubject<UrlSegment[]>([new UrlSegment(segment, {})]);
	return { url: url$ };
}

describe('FeaturePageLayout', () => {
	describe('nextRoute carousel navigation', () => {
		it('returns xp when current route is perks (index 0 → index 1)', async () => {
			const { fixture } = await render(FeaturePageLayout, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: ActivatedRoute, useValue: makeRoute('perks') },
				],
			});

			expect(fixture.componentInstance.nextRoute()).toBe('xp');
		});

		it('wraps forward from badges back to perks (index 2 → index 0)', async () => {
			const { fixture } = await render(FeaturePageLayout, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: ActivatedRoute, useValue: makeRoute('badges') },
				],
			});

			expect(fixture.componentInstance.nextRoute()).toBe('perks');
		});
	});

	describe('prevRoute carousel navigation', () => {
		it('returns perks when current route is xp (index 1 → index 0)', async () => {
			const { fixture } = await render(FeaturePageLayout, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: ActivatedRoute, useValue: makeRoute('xp') },
				],
			});

			expect(fixture.componentInstance.prevRoute()).toBe('perks');
		});

		it('wraps backward from perks to badges (index 0 → index 2)', async () => {
			const { fixture } = await render(FeaturePageLayout, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: ActivatedRoute, useValue: makeRoute('perks') },
				],
			});

			expect(fixture.componentInstance.prevRoute()).toBe('badges');
		});
	});

	describe('template', () => {
		it('renders a Back to home link pointing to /home', async () => {
			await render(FeaturePageLayout, {
				providers: [
					provideRouter([]),
					provideTranslocoTesting(),
					{ provide: ActivatedRoute, useValue: makeRoute('perks') },
				],
			});

			const link = screen.getByRole('link', { name: /Back to home/ });
			expect(link).toBeTruthy();
			expect(link.getAttribute('href')).toBe('/home');
		});
	});
});
