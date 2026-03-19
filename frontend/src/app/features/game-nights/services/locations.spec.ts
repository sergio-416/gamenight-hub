import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_CONFIG } from "@core/config/api.config";
import type { Location } from "../models/location.model";
import { LocationsService } from "./locations";

describe("LocationsService", () => {
	let service: LocationsService;
	let httpMock: HttpTestingController;

	const apiUrl = API_CONFIG.baseUrl;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				LocationsService,
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		});
		service = TestBed.inject(LocationsService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe("create location", () => {
		it("should create new game night location when valid data provided", () => {
			const newLocation = {
				name: "New Board Game Cafe",
				latitude: 41.5,
				longitude: 2.2,
				address: "123 Game Street",
				venueType: "cafe" as const,
				capacity: 20,
			};

			const createdLocation: Location = {
				id: "507f1f77bcf86cd799439011",
				...newLocation,
				amenities: [],
				createdAt: new Date(),
			};

			service.createLocation(newLocation).subscribe((location: Location) => {
				expect(location).toEqual(createdLocation);
				expect(location.id).toBeDefined();
			});

			const req = httpMock.expectOne(`${apiUrl}/locations`);
			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual(newLocation);
			req.flush(createdLocation);
		});
	});

	describe("update location", () => {
		it("should update location fields when valid data provided", () => {
			const updateData = { name: "Updated Cafe Name", capacity: 25 };
			const locationId = "507f1f77bcf86cd799439011";

			const updatedLocation: Location = {
				id: locationId,
				name: "Updated Cafe Name",
				latitude: 41.38,
				longitude: 2.17,
				venueType: "cafe",
				capacity: 25,
			};

			service
				.updateLocation(locationId, updateData)
				.subscribe((location: Location) => {
					expect(location.name).toBe("Updated Cafe Name");
					expect(location.capacity).toBe(25);
				});

			const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
			expect(req.request.method).toBe("PATCH");
			expect(req.request.body).toEqual(updateData);
			req.flush(updatedLocation);
		});
	});

	describe("delete location", () => {
		it("should remove location when valid id provided", () => {
			const locationId = "507f1f77bcf86cd799439011";
			const deletedLocation: Location = {
				id: locationId,
				name: "Closed Cafe",
				latitude: 41.38,
				longitude: 2.17,
				venueType: "cafe",
			};

			service.deleteLocation(locationId).subscribe((location: Location) => {
				expect(location.id).toBe(locationId);
			});

			const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
			expect(req.request.method).toBe("DELETE");
			req.flush(deletedLocation);
		});
	});

	describe("find in bounds", () => {
		it("should return only locations within specified bounding box", () => {
			const swLat = 41.3;
			const swLng = 2.1;
			const neLat = 41.5;
			const neLng = 2.2;

			const locationsInBounds: Location[] = [
				{
					id: "1",
					name: "Cafe Inside",
					latitude: 41.38,
					longitude: 2.15,
					venueType: "cafe",
				},
				{
					id: "2",
					name: "Store Inside",
					latitude: 41.4,
					longitude: 2.18,
					venueType: "store",
				},
			];

			service
				.findInBounds(swLat, swLng, neLat, neLng)
				.subscribe((locations: Location[]) => {
					expect(locations).toEqual(locationsInBounds);
					expect(locations.length).toBe(2);
				});

			const expectedUrl = `${apiUrl}/locations/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`;
			const req = httpMock.expectOne(expectedUrl);
			expect(req.request.method).toBe("GET");
			req.flush(locationsInBounds);
		});

		it("should return empty array when no locations in specified bounds", () => {
			service.findInBounds(0, 0, 0, 0).subscribe((locations: Location[]) => {
				expect(locations).toEqual([]);
				expect(locations.length).toBe(0);
			});

			const req = httpMock.expectOne(
				`${apiUrl}/locations/bounds?swLat=0&swLng=0&neLat=0&neLng=0`,
			);
			req.flush([]);
		});
	});
});
