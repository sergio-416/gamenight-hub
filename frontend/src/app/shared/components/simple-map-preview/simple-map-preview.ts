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
	viewChild,
} from '@angular/core';
import { environment } from '@env';
import * as L from 'leaflet';

const LEAFLET = new InjectionToken<typeof L>('leaflet', {
	factory: () => L,
});

const JAWG_URL = `https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=${environment.jawgAccessToken}`;
const DEFAULT_CENTER: [number, number] = [41.3874, 2.1686];
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 14;

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
	<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10b981" stroke="white" stroke-width="1.2"/>
	<circle cx="12" cy="9" r="2.5" fill="white"/>
</svg>`;

@Component({
	selector: 'app-simple-map-preview',
	host: { class: 'block h-full w-full' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div
			#mapContainer
			class="h-full w-full"
			[class.opacity-30]="!hasLocation()"
		></div>
	`,
})
export class SimpleMapPreview implements AfterViewInit, OnDestroy {
	readonly latitude = input<number | undefined>();
	readonly longitude = input<number | undefined>();
	readonly locationName = input<string | undefined>();

	readonly mapContainer = viewChild.required<ElementRef>('mapContainer');

	readonly #L = inject(LEAFLET);
	#map?: L.Map;
	#marker?: L.Marker;

	readonly hasLocation = computed(() => this.latitude() != null && this.longitude() != null);

	ngAfterViewInit(): void {
		this.#initMap();
	}

	ngOnDestroy(): void {
		this.#map?.remove();
	}

	#initMap(): void {
		const container = this.mapContainer().nativeElement;
		const lat = this.latitude();
		const lng = this.longitude();
		const hasPin = lat != null && lng != null;

		this.#map = this.#L
			.map(container, {
				zoomControl: false,
				attributionControl: false,
				dragging: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				touchZoom: false,
			})
			.setView(hasPin ? [lat, lng] : DEFAULT_CENTER, hasPin ? PIN_ZOOM : DEFAULT_ZOOM);

		this.#L.tileLayer(JAWG_URL, { minZoom: 0, maxZoom: 22 }).addTo(this.#map);

		if (hasPin) {
			this.#updateMarker(lat, lng, this.locationName());
		}
	}

	#updateMarker(lat: number, lng: number, name?: string): void {
		if (!this.#map) return;
		this.#removeMarker();

		const icon = this.#L.divIcon({
			className: 'custom-marker',
			html: PIN_SVG,
			iconSize: [32, 32],
			iconAnchor: [16, 32],
		});

		this.#marker = this.#L.marker([lat, lng], { icon }).addTo(this.#map);

		if (name) {
			this.#marker.bindTooltip(name, {
				permanent: true,
				direction: 'top',
				offset: [0, -32],
				className: 'wizard-map-tooltip',
			});
		}
	}

	#removeMarker(): void {
		if (this.#marker) {
			this.#marker.remove();
			this.#marker = undefined;
		}
	}
}
