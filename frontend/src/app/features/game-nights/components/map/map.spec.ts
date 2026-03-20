import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { provideTranslocoScope } from '@jsverse/transloco';
import { render, screen } from '@testing-library/angular';
import { of, Subject, throwError } from 'rxjs';
import type { Location } from '../../models/location.model';
import { LocationsService } from '../../services/locations';
import { GameNightsMap, LEAFLET } from './map';

function createLeafletMock() {
	const mapInstance = {
		setView: vi.fn().mockReturnThis(),
		on: vi.fn().mockReturnThis(),
		getBounds: vi.fn().mockReturnValue({
			getSouthWest: vi.fn().mockReturnValue({ lat: 41.3, lng: 2.1 }),
			getNorthEast: vi.fn().mockReturnValue({ lat: 41.5, lng: 2.2 }),
		}),
		remove: vi.fn(),
		invalidateSize: vi.fn(),
	};

	const tileLayerInstance = { addTo: vi.fn().mockReturnThis() };

	const markerInstance = {
		bindPopup: vi.fn().mockReturnThis(),
		addTo: vi.fn().mockReturnThis(),
		remove: vi.fn(),
		on: vi.fn().mockReturnThis(),
	};

	return {
		leafletMock: {
			map: vi.fn().mockReturnValue(mapInstance),
			tileLayer: vi.fn().mockReturnValue(tileLayerInstance),
			marker: vi.fn().mockReturnValue(markerInstance),
			divIcon: vi.fn().mockReturnValue({ className: 'custom-marker' }),
			DomEvent: {
				on: vi.fn(),
				stopPropagation: vi.fn(),
			},
		},
		mapInstance,
		tileLayerInstance,
		markerInstance,
	};
}

describe('GameNightsMap', () => {
	let mockLocationsService: { findInBounds: ReturnType<typeof vi.fn> };
	let leafletMock: ReturnType<typeof createLeafletMock>['leafletMock'];
	let mapInstance: ReturnType<typeof createLeafletMock>['mapInstance'];
	let markerInstance: ReturnType<typeof createLeafletMock>['markerInstance'];

	beforeEach(() => {
		mockLocationsService = { findInBounds: vi.fn() };
		({ leafletMock, mapInstance, markerInstance } = createLeafletMock());
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	async function renderMap(isLoggedIn = true) {
		return render(GameNightsMap, {
			componentInputs: { isLoggedIn },
			providers: [
				provideTranslocoTesting(),
				{ provide: LocationsService, useValue: mockLocationsService },
				{ provide: LEAFLET, useValue: leafletMock },
			],
		});
	}

	describe('map initialization', () => {
		it('should display interactive map when component loads', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(screen.getByTestId('map-container')).toBeTruthy();
		});

		it('should initialize Leaflet map with correct center and zoom', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(leafletMock.map).toHaveBeenCalledTimes(1);
			expect(mapInstance.setView).toHaveBeenCalledWith([41.38, 2.17], 12);
		});

		it('should add a Jawg tile layer to the map on initialization', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(leafletMock.tileLayer).toHaveBeenCalledWith(
				expect.stringContaining('tile.jawg.io/jawg-light'),
				expect.objectContaining({ attribution: expect.any(String) }),
			);
			expect(leafletMock.tileLayer.mock.results[0].value.addTo).toHaveBeenCalled();
		});

		it('should register a moveend listener on the map', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(mapInstance.on).toHaveBeenCalledWith('moveend', expect.any(Function));
		});
	});

	describe('location markers', () => {
		it('should display markers for all game night locations', async () => {
			const mockLocations: Location[] = [
				{
					id: '1',
					name: 'Board Game Cafe',
					latitude: 41.38,
					longitude: 2.17,
					venueType: 'cafe',
				},
				{
					id: '2',
					name: 'Game Store',
					latitude: 41.4,
					longitude: 2.18,
					venueType: 'store',
				},
			];
			mockLocationsService.findInBounds.mockReturnValue(of(mockLocations));
			await renderMap();
			expect(mockLocationsService.findInBounds).toHaveBeenCalled();
			expect(leafletMock.marker).toHaveBeenCalledTimes(2);
			expect(leafletMock.marker).toHaveBeenCalledWith(
				[41.38, 2.17],
				expect.objectContaining({ icon: expect.anything() }),
			);
			expect(leafletMock.marker).toHaveBeenCalledWith(
				[41.4, 2.18],
				expect.objectContaining({ icon: expect.anything() }),
			);
		});

		it('should create a custom div icon for each marker', async () => {
			const mockLocations: Location[] = [
				{
					id: '1',
					name: 'Board Game Cafe',
					latitude: 41.38,
					longitude: 2.17,
					venueType: 'cafe',
				},
			];
			mockLocationsService.findInBounds.mockReturnValue(of(mockLocations));
			await renderMap();
			expect(leafletMock.divIcon).toHaveBeenCalledTimes(1);
			expect(leafletMock.divIcon).toHaveBeenCalledWith(
				expect.objectContaining({
					className: 'custom-marker',
					iconSize: [32, 32],
					iconAnchor: [16, 32],
					popupAnchor: [0, -32],
				}),
			);
		});

		it('should show empty map when no locations exist', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(mockLocationsService.findInBounds).toHaveBeenCalled();
			expect(leafletMock.marker).not.toHaveBeenCalled();
		});

		it('should call getBounds to determine the visible map area when loading locations', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(mapInstance.getBounds).toHaveBeenCalled();
		});

		it('should query locations using the current map bounds', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			await renderMap();
			expect(mockLocationsService.findInBounds).toHaveBeenCalledWith(41.3, 2.1, 41.5, 2.2);
		});
	});

	describe('loading state', () => {
		it('should display loading indicator while fetching locations', async () => {
			const subject = new Subject<Location[]>();
			mockLocationsService.findInBounds.mockReturnValue(subject);

			const { detectChanges } = await renderMap();

			expect(screen.getByTestId('loading-indicator')).toBeTruthy();

			subject.next([]);
			subject.complete();
			detectChanges();

			expect(screen.queryByTestId('loading-indicator')).toBeNull();
		});
	});

	describe('error state', () => {
		it('should display error message when fetching locations fails', async () => {
			mockLocationsService.findInBounds.mockReturnValue(throwError(() => new Error('Failed')));
			await renderMap();
			expect(screen.getByTestId('error-message')).toBeTruthy();
		});
	});

	describe('marker popups', () => {
		it('should display venue information when marker clicked', async () => {
			const mockLocation: Location = {
				id: '1',
				name: 'Board Game Cafe',
				latitude: 41.38,
				longitude: 2.17,
				venueType: 'cafe',
				address: '123 Game Street',
			};
			mockLocationsService.findInBounds.mockReturnValue(of([mockLocation]));
			await renderMap();
			expect(mockLocation.name).toBeDefined();
			expect(markerInstance.bindPopup).toHaveBeenCalledWith(expect.any(HTMLElement));
		});
	});

	describe('authentication behavior', () => {
		it('should render the map container when user is authenticated', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			const { container } = await renderMap(true);
			expect(container.querySelector('[data-testid="map-container"]')).toBeTruthy();
		});

		it('should render the map container when user is not authenticated', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			const { container } = await renderMap(false);
			expect(container.querySelector('[data-testid="map-container"]')).toBeTruthy();
		});

		it('should not display add location button when user is not authenticated', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			const { container } = await renderMap(false);
			expect(container.querySelector('[data-testid="add-location-button"]')).toBeNull();
		});

		it('should attach a delete button via L.DomEvent.on when user is authenticated', async () => {
			const mockLocation: Location = {
				id: '1',
				name: 'Board Game Cafe',
				latitude: 41.38,
				longitude: 2.17,
				venueType: 'cafe',
			};
			mockLocationsService.findInBounds.mockReturnValue(of([mockLocation]));
			await renderMap(true);
			expect(leafletMock.DomEvent.on).toHaveBeenCalledWith(
				expect.any(HTMLElement),
				'click',
				expect.any(Function),
			);
		});

		it('should NOT attach a delete button via L.DomEvent.on when user is not authenticated', async () => {
			const mockLocation: Location = {
				id: '1',
				name: 'Board Game Cafe',
				latitude: 41.38,
				longitude: 2.17,
				venueType: 'cafe',
			};
			mockLocationsService.findInBounds.mockReturnValue(of([mockLocation]));
			await renderMap(false);
			expect(leafletMock.DomEvent.on).not.toHaveBeenCalled();
		});
	});

	describe('capacity badges', () => {
		it('should include capacity badge in marker icon when event has maxPlayers', async () => {
			const mockLocations: Location[] = [
				{
					id: 'loc-1',
					name: 'Board Game Cafe',
					latitude: 41.38,
					longitude: 2.17,
					venueType: 'cafe',
				},
			];
			mockLocationsService.findInBounds.mockReturnValue(of(mockLocations));
			await render(GameNightsMap, {
				componentInputs: {
					isLoggedIn: true,
					events: [
						{
							id: 'evt-1',
							title: 'Friday Night Games',
							locationId: 'loc-1',
							startTime: new Date('2026-04-01T19:00:00Z'),
							maxPlayers: 6,
							participantCount: 3,
						},
					],
				},
				providers: [
					provideTranslocoTesting(),
					provideTranslocoScope('game-nights'),
					{ provide: LocationsService, useValue: mockLocationsService },
					{ provide: LEAFLET, useValue: leafletMock },
				],
			});

			expect(leafletMock.divIcon).toHaveBeenCalledWith(
				expect.objectContaining({
					html: expect.stringContaining('3/6'),
				}),
			);
		});
	});

	describe('marker click events', () => {
		it('should emit markerClick when marker with events is clicked', async () => {
			const mockLocations: Location[] = [
				{
					id: 'loc-1',
					name: 'Board Game Cafe',
					latitude: 41.38,
					longitude: 2.17,
					venueType: 'cafe',
				},
			];
			mockLocationsService.findInBounds.mockReturnValue(of(mockLocations));
			const markerClickSpy = vi.fn();

			const { fixture } = await render(GameNightsMap, {
				componentInputs: {
					isLoggedIn: true,
					events: [
						{
							id: 'evt-1',
							title: 'Friday Night Games',
							locationId: 'loc-1',
							startTime: new Date('2026-04-01T19:00:00Z'),
							maxPlayers: 6,
						},
					],
				},
				providers: [
					provideTranslocoTesting(),
					provideTranslocoScope('game-nights'),
					{ provide: LocationsService, useValue: mockLocationsService },
					{ provide: LEAFLET, useValue: leafletMock },
				],
			});

			fixture.componentInstance.markerClick.subscribe(markerClickSpy);

			const clickCall = (markerInstance.on.mock.calls as [string, () => void][]).find(
				(c) => c[0] === 'click',
			);
			expect(clickCall).toBeTruthy();
			clickCall?.[1]();

			expect(markerClickSpy).toHaveBeenCalledWith('evt-1');
		});
	});

	describe('invalidateSize', () => {
		it('should call invalidateSize on the Leaflet map', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			const { fixture } = await renderMap();

			fixture.componentInstance.invalidateSize();

			expect(mapInstance.invalidateSize).toHaveBeenCalled();
		});
	});

	describe('map cleanup', () => {
		it('should call map.remove() when component is destroyed', async () => {
			mockLocationsService.findInBounds.mockReturnValue(of([]));
			const { fixture } = await renderMap();
			mapInstance.remove.mockClear();
			fixture.destroy();
			expect(mapInstance.remove).toHaveBeenCalledOnce();
		});

		it('should remove all markers when loading new locations', async () => {
			const firstLocations: Location[] = [
				{
					id: '1',
					name: 'Cafe A',
					latitude: 41.38,
					longitude: 2.17,
					venueType: 'cafe',
				},
			];
			const subject = new Subject<Location[]>();
			mockLocationsService.findInBounds.mockReturnValue(subject);

			const { detectChanges } = await renderMap();

			subject.next(firstLocations);
			detectChanges();

			const firstMarker = leafletMock.marker.mock.results[0].value;

			subject.next([]);
			detectChanges();

			expect(firstMarker.remove).toHaveBeenCalled();
		});
	});
});
