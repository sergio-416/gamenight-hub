import { provideRouter } from '@angular/router';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import type { EventWithParticipants } from '@game-nights/models/event-with-participants';
import { provideTranslocoScope } from '@jsverse/transloco';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MapPreviewCard } from './map-preview-card';

function createMockEvent(overrides: Partial<EventWithParticipants> = {}): EventWithParticipants {
	return {
		id: 'map-evt-1',
		title: 'Saturday Catan Night',
		locationId: 'loc-2',
		startTime: new Date('2026-03-14T18:00:00Z'),
		maxPlayers: 6,
		category: 'strategy',
		participantCount: 2,
		...overrides,
	};
}

const stubFormatDate = (_d: string | Date) => 'Mar 14, 2026';

async function renderCard(event: EventWithParticipants, opts: { locationName?: string } = {}) {
	return render(MapPreviewCard, {
		providers: [provideRouter([]), provideTranslocoTesting(), provideTranslocoScope('game-nights')],
		componentInputs: {
			event,
			locationName: opts.locationName ?? 'Game Store',
			formatDate: stubFormatDate,
		},
	});
}

describe('MapPreviewCard', () => {
	it('should render event title', async () => {
		await renderCard(createMockEvent());

		expect(screen.getByText('Saturday Catan Night')).toBeTruthy();
	});

	it('should render formatted date', async () => {
		await renderCard(createMockEvent());

		expect(screen.getByText('Mar 14, 2026')).toBeTruthy();
	});

	it('should render location name', async () => {
		await renderCard(createMockEvent(), { locationName: 'Dice & Board' });

		expect(screen.getByText('Dice & Board')).toBeTruthy();
	});

	it('should render capacity label when maxPlayers set', async () => {
		await renderCard(createMockEvent({ maxPlayers: 6, participantCount: 2 }));

		expect(screen.getByText('2/6 Joined')).toBeTruthy();
	});

	it('should render Full badge when at capacity', async () => {
		await renderCard(createMockEvent({ maxPlayers: 4, participantCount: 4 }));

		expect(screen.getByText('Full')).toBeTruthy();
	});

	it('should render View Details link with correct route', async () => {
		await renderCard(createMockEvent({ id: 'map-evt-1' }));

		const link = screen.getByRole('link', {
			name: /view details for saturday catan night/i,
		});
		expect(link).toBeTruthy();
		expect(link.getAttribute('href')).toBe('/events/map-evt-1');
	});

	it('should emit close event when close button clicked', async () => {
		const user = userEvent.setup();
		const closeSpy = vi.fn();

		const { fixture } = await renderCard(createMockEvent());
		fixture.componentInstance.close.subscribe(closeSpy);

		const closeBtn = screen.getByRole('button', {
			name: /close preview/i,
		});
		await user.click(closeBtn);

		expect(closeSpy).toHaveBeenCalledOnce();
	});

	it('should render category badge when category exists', async () => {
		await renderCard(createMockEvent({ category: 'strategy' }));

		expect(screen.getByText('Strategy')).toBeTruthy();
	});
});
