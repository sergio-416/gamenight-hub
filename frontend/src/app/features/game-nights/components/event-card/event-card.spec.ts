import { provideRouter } from '@angular/router';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import type { EventWithParticipants } from '@game-nights/models/event-with-participants';
import { provideTranslocoScope } from '@jsverse/transloco';
import { render, screen } from '@testing-library/angular';
import { EventCard } from './event-card';

function createMockEvent(overrides: Partial<EventWithParticipants> = {}): EventWithParticipants {
	return {
		id: 'abc-123',
		title: 'Friday Board Games',
		locationId: 'loc-1',
		startTime: new Date('2026-03-13T19:00:00Z'),
		maxPlayers: 8,
		description: 'Bring your favourite games!',
		category: 'strategy',
		participantCount: 3,
		gameImageUrl: 'https://cf.geekdo-images.com/test.jpg',
		...overrides,
	};
}

const stubFormatDate = (_d: string | Date) => 'Mar 13, 2026';

async function renderCard(
	event: EventWithParticipants,
	opts: { locationName?: string; postalCode?: string } = {},
) {
	return render(EventCard, {
		providers: [provideRouter([]), provideTranslocoTesting(), provideTranslocoScope('game-nights')],
		componentInputs: {
			event,
			locationName: opts.locationName ?? 'Test Location',
			postalCode: opts.postalCode,
			formatDate: stubFormatDate,
		},
	});
}

describe('EventCard', () => {
	it('should render event title', async () => {
		await renderCard(createMockEvent());

		expect(screen.getByText('Friday Board Games')).toBeTruthy();
	});

	it('should render game image when gameImageUrl is provided', async () => {
		await renderCard(createMockEvent());

		const img = screen.getByRole('img');
		expect(img).toBeTruthy();
		expect(img.getAttribute('src')).toBe('https://cf.geekdo-images.com/test.jpg');
	});

	it('should render fallback when no image URLs exist', async () => {
		await renderCard(
			createMockEvent({
				gameImageUrl: undefined,
				gameThumbnailUrl: undefined,
			}),
		);

		expect(screen.queryByRole('img')).toBeNull();
	});

	it('should render category label', async () => {
		await renderCard(createMockEvent({ category: 'strategy' }));

		expect(screen.getByText('Strategy')).toBeTruthy();
	});

	it('should render capacity as X/Y Joined when not full', async () => {
		await renderCard(createMockEvent({ maxPlayers: 8, participantCount: 3 }));

		expect(screen.getByText('3/8 Joined')).toBeTruthy();
	});

	it('should render Full badge when at capacity', async () => {
		await renderCard(createMockEvent({ maxPlayers: 4, participantCount: 4 }));

		expect(screen.getByText('Full')).toBeTruthy();
	});

	it('should not render capacity info when maxPlayers is undefined', async () => {
		await renderCard(createMockEvent({ maxPlayers: undefined, participantCount: 2 }));

		expect(screen.queryByText(/Joined/i)).toBeNull();
		expect(screen.queryByText('Full')).toBeNull();
	});

	it('should render formatted date', async () => {
		await renderCard(createMockEvent());

		expect(screen.getByText(/Mar 13, 2026/)).toBeTruthy();
	});

	it('should render postal code when available', async () => {
		await renderCard(createMockEvent(), {
			locationName: 'Board Game Cafe',
			postalCode: '49080',
		});

		expect(screen.getByText(/49080/)).toBeTruthy();
	});

	it('should render location name when no postal code', async () => {
		await renderCard(createMockEvent(), {
			locationName: 'Board Game Cafe',
		});

		expect(screen.getByText(/Board Game Cafe/)).toBeTruthy();
	});

	it('should render View Details link with correct href', async () => {
		await renderCard(createMockEvent({ id: 'abc-123' }));

		const link = screen.getByRole('link', { name: /view details/i });
		expect(link).toBeTruthy();
		expect(link.getAttribute('href')).toBe('/events/abc-123');
	});

	it('should render Waitlist Only when event is full', async () => {
		await renderCard(createMockEvent({ maxPlayers: 4, participantCount: 4 }));

		expect(screen.getByText('Waitlist Only')).toBeTruthy();
	});
});
