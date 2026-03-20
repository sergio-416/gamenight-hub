import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { StatsUnauthenticated } from './stats-unauthenticated';

describe('StatsUnauthenticated', () => {
	beforeEach(async () => {
		await render(StatsUnauthenticated, {
			providers: [provideTranslocoTesting()],
		});
	});

	describe('hero section', () => {
		it('should display the stats page heading', () => {
			expect(screen.getByRole('heading', { name: /your collection insights/i })).toBeTruthy();
		});

		it('should invite the user to sign in to unlock stats', () => {
			expect(screen.getByText(/sign in to unlock your stats/i)).toBeTruthy();
		});

		it('should have a sign in link that points to the login page', () => {
			const signInLink = screen.getByRole('link', { name: /sign in/i });
			expect(signInLink.getAttribute('href')).toBe('/login');
		});

		it('should have a create account link that points to the login page', () => {
			const registerLink = screen.getByRole('link', {
				name: /create an account/i,
			});
			expect(registerLink.getAttribute('href')).toContain('/login');
		});
	});

	describe('features section', () => {
		it('should display the Categories feature', () => {
			expect(screen.getByRole('heading', { name: /categories/i })).toBeTruthy();
			expect(screen.getByText(/bulk of your collection/i)).toBeTruthy();
		});

		it('should display the Growth feature', () => {
			expect(screen.getByRole('heading', { name: /growth/i })).toBeTruthy();
			expect(screen.getByText(/month by month/i)).toBeTruthy();
		});

		it('should display the Complexity feature', () => {
			expect(screen.getByRole('heading', { name: /complexity/i })).toBeTruthy();
			expect(screen.getByText(/complexity spread/i)).toBeTruthy();
		});
	});

	describe('image placeholder', () => {
		it('should display the image placeholder', () => {
			expect(screen.getByText(/image coming soon/i)).toBeTruthy();
		});
	});

	describe('landmark structure', () => {
		it('should have a main landmark', () => {
			expect(screen.getByRole('main')).toBeTruthy();
		});
	});
});
