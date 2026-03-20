import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { CollectionUnauthenticated } from './collection-unauthenticated';

describe('CollectionUnauthenticated', () => {
	beforeEach(async () => {
		await render(CollectionUnauthenticated, {
			providers: [provideTranslocoTesting()],
		});
	});

	describe('hero section', () => {
		it('should display the collection page heading', () => {
			expect(screen.getByRole('heading', { name: /your board game collection/i })).toBeTruthy();
		});

		it('should describe what the collection feature does', () => {
			expect(screen.getByText(/sign in to start building your collection/i)).toBeTruthy();
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
		it('should display the Import feature', () => {
			expect(screen.getByRole('heading', { name: /import/i })).toBeTruthy();
			expect(screen.getByText(/add any game to your personal library/i)).toBeTruthy();
		});

		it('should display the Discover feature', () => {
			expect(screen.getByRole('heading', { name: /discover/i })).toBeTruthy();
			expect(screen.getByText(/ai-powered game recommendations/i)).toBeTruthy();
		});

		it('should display the Track feature', () => {
			expect(screen.getByRole('heading', { name: /track/i })).toBeTruthy();
			expect(screen.getByText(/stats and insights/i)).toBeTruthy();
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
