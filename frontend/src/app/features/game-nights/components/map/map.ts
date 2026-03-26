import {
	type AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	type ElementRef,
	InjectionToken,
	inject,
	input,
	type OnDestroy,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { environment } from '@env';
import type { EventWithParticipants } from '@game-nights/models/event-with-participants';
import type { Location } from '@game-nights/models/location.model';
import { LocationsService } from '@game-nights/services/locations';
import { TranslocoDirective } from '@jsverse/transloco';
import * as L from 'leaflet';

export const LEAFLET = new InjectionToken<typeof L>('leaflet', {
	factory: () => L,
});

@Component({
	selector: 'app-map',
	imports: [TranslocoDirective],
	templateUrl: './map.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameNightsMap implements AfterViewInit, OnDestroy {
	readonly #locationsService = inject(LocationsService);
	readonly #L = inject(LEAFLET);

	readonly reloadTrigger = input<number>(0);
	readonly activeLocationIds = input<ReadonlySet<string>>();
	readonly events = input<EventWithParticipants[]>([]);
	readonly isLoggedIn = input(false);
	readonly deleteLocation = output<string>();
	readonly addLocation = output<void>();
	readonly markerClick = output<string>();

	readonly mapContainer = viewChild.required<ElementRef>('mapContainer');

	readonly #eventsByLocationId = computed(() => {
		const map = new Map<string, EventWithParticipants[]>();
		for (const event of this.events()) {
			const existing = map.get(event.locationId) ?? [];
			existing.push(event);
			map.set(event.locationId, existing);
		}
		return map;
	});

	readonly #loading = signal(false);
	readonly #error = signal<string | null>(null);

	readonly loading = this.#loading.asReadonly();
	readonly error = this.#error.asReadonly();

	#map?: L.Map;
	#markers: L.Marker[] = [];

	ngAfterViewInit(): void {
		this.#initializeMap();
		this.#loadLocationsInBounds();
	}

	ngOnDestroy(): void {
		this.#map?.remove();
	}

	invalidateSize(): void {
		this.#map?.invalidateSize();
	}

	onAddLocation(): void {
		this.addLocation.emit();
	}

	requestDeleteLocation(locationId: string): void {
		this.deleteLocation.emit(locationId);
	}

	#initializeMap(): void {
		const container = this.mapContainer().nativeElement;

		this.#map = this.#L.map(container).setView([41.38, 2.17], 12);

		this.#L
			.tileLayer(
				`https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=${environment.jawgAccessToken}`,
				{
					attribution:
						'<a href="https://jawg.io" target="_blank">\u00a9 <b>Jawg</b>Maps</a> \u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					minZoom: 0,
					maxZoom: 22,
				},
			)
			.addTo(this.#map);

		this.#map.on('moveend', () => this.#loadLocationsInBounds());
	}

	#loadLocationsInBounds(): void {
		if (!this.#map) return;

		const bounds = this.#map.getBounds();
		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();

		this.#loading.set(true);
		this.#error.set(null);

		this.#locationsService.findInBounds(sw.lat, sw.lng, ne.lat, ne.lng).subscribe({
			next: (locations) => {
				this.#addMarkers(locations);
				this.#loading.set(false);
			},
			error: () => {
				this.#error.set('Failed to load locations');
				this.#loading.set(false);
			},
		});
	}

	#addMarkers(locations: Location[]): void {
		if (!this.#map) return;

		this.#clearMarkers();

		const activeIds = this.activeLocationIds();
		const filtered = activeIds ? locations.filter((loc) => activeIds.has(loc.id)) : locations;

		filtered.forEach((location) => {
			const locationEvents = this.#eventsByLocationId().get(location.id) ?? [];
			const hasEvents = locationEvents.length > 0;
			const firstEvent = locationEvents[0];
			const isFull =
				hasEvents &&
				firstEvent.maxPlayers !== undefined &&
				(firstEvent.participantCount ?? 0) >= firstEvent.maxPlayers;

			const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
					<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10b981" stroke="white" stroke-width="1.2"/>
					<circle cx="12" cy="9" r="2.5" fill="white"/>
				</svg>`;

			const badgeHtml =
				hasEvents && firstEvent.maxPlayers
					? `<div style="position:absolute;top:-8px;right:-8px;background:${isFull ? '#ef4444' : '#10b981'};color:white;font-size:10px;font-weight:600;padding:1px 4px;border-radius:9999px;white-space:nowrap;line-height:1.4;min-width:16px;text-align:center;">${firstEvent.participantCount ?? 0}/${firstEvent.maxPlayers}</div>`
					: '';

			const customIcon = this.#L.divIcon({
				className: 'custom-marker',
				html: `<div style="position:relative;">${svgPin}${badgeHtml}</div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32],
			});

			const popupContent = document.createElement('div');
			popupContent.className = 'marker-popup';

			const title = document.createElement('h3');
			title.textContent = location.name;
			popupContent.appendChild(title);

			const venueType = document.createElement('p');
			venueType.textContent = location.venueType || 'Venue';
			popupContent.appendChild(venueType);

			if (location.address) {
				const address = document.createElement('p');
				address.textContent = location.address;
				popupContent.appendChild(address);
			}

			if (this.isLoggedIn()) {
				const deleteButton = document.createElement('button');
				deleteButton.textContent = 'Delete';
				deleteButton.className = 'delete-btn';
				deleteButton.style.cssText = `
					background: var(--color-danger);
					color: white;
					border: none;
					padding: 4px 8px;
					border-radius: 4px;
					cursor: pointer;
					margin-top: 8px;
				`;

				this.#L.DomEvent.on(deleteButton, 'click', (e) => {
					this.#L.DomEvent.stopPropagation(e);
					this.requestDeleteLocation(location.id);
				});

				popupContent.appendChild(deleteButton);
			}

			const marker = this.#L
				.marker([location.latitude, location.longitude], {
					icon: customIcon,
				})
				.bindPopup(popupContent)
				.addTo(this.#map!);

			marker.on('click', () => {
				if (locationEvents.length > 0) {
					this.markerClick.emit(locationEvents[0].id);
				}
			});

			this.#markers.push(marker);
		});
	}

	#clearMarkers(): void {
		for (const marker of this.#markers) {
			marker.remove();
		}
		this.#markers = [];
	}
}
