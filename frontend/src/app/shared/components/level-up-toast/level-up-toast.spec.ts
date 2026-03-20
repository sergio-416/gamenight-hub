import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen } from '@testing-library/angular';
import { LevelUpToast } from './level-up-toast';

async function renderToast(level: number, title: string) {
	return render(LevelUpToast, {
		inputs: { level, title },
		providers: [provideTranslocoTesting()],
	});
}

describe('LevelUpToast', () => {
	it('should render the level number', async () => {
		await renderToast(5, 'Guild Member');

		expect(screen.getByText('5')).toBeTruthy();
	});

	it('should render the title', async () => {
		await renderToast(5, 'Guild Member');

		expect(screen.getByText('Guild Member')).toBeTruthy();
	});

	it('should render the Level Up heading', async () => {
		await renderToast(3, 'Apprentice Archivist');

		expect(screen.getByText('Level Up!')).toBeTruthy();
	});

	it('should show the overlay', async () => {
		await renderToast(2, 'Curious Collector');

		expect(screen.getByTestId('level-up-overlay')).toBeTruthy();
	});

	it('should auto-dismiss after 4 seconds', async () => {
		vi.useFakeTimers();

		const { fixture } = await renderToast(4, 'Tavern Regular');

		expect(screen.getByTestId('level-up-overlay')).toBeTruthy();

		vi.advanceTimersByTime(4000);
		fixture.detectChanges();

		expect(screen.queryByTestId('level-up-overlay')).toBeNull();

		vi.useRealTimers();
	});
});
