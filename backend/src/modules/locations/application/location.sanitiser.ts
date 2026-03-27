import type { SelectLocation } from '@database/schema/locations.js';

export interface LocationResponse {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	address: string | null;
	postalCode: string | null;
	venueType: string | null;
}

export function toLocationResponse(location: SelectLocation): LocationResponse {
	return {
		id: location.id,
		name: location.name,
		latitude: location.latitude,
		longitude: location.longitude,
		address: location.address,
		postalCode: location.postalCode,
		venueType: location.venueType,
	};
}
