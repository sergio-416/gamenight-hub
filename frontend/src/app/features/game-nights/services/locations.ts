import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import type { Observable } from 'rxjs';
import type { CreateLocation, Location } from '../models/location.model';

const API_URL = API_CONFIG.baseUrl;

@Injectable({
	providedIn: 'root',
})
export class LocationsService {
	readonly #http = inject(HttpClient);

	createLocation(location: CreateLocation): Observable<Location> {
		return this.#http.post<Location>(`${API_URL}/locations`, location);
	}

	updateLocation(id: string, location: Partial<Location>): Observable<Location> {
		return this.#http.patch<Location>(`${API_URL}/locations/${id}`, location);
	}

	deleteLocation(id: string): Observable<Location> {
		return this.#http.delete<Location>(`${API_URL}/locations/${id}`);
	}

	findInBounds(swLat: number, swLng: number, neLat: number, neLng: number): Observable<Location[]> {
		return this.#http.get<Location[]>(
			`${API_URL}/locations/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`,
		);
	}
}
