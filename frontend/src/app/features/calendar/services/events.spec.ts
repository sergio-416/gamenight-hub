import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_CONFIG } from "@core/config/api.config";
import type { Event } from "../models/event.model";
import { EventsService } from "./events";

describe("EventsService", () => {
	let service: EventsService;
	let httpMock: HttpTestingController;

	const apiUrl = API_CONFIG.baseUrl;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				EventsService,
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		});
		service = TestBed.inject(EventsService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe("update event", () => {
		it("should update event fields when valid data provided", () => {
			const eventId = "507f1f77bcf86cd799439011";
			const updateData = { title: "Updated Game Night", maxPlayers: 8 };

			const updatedEvent: Event = {
				id: eventId,
				title: "Updated Game Night",
				gameId: "507f1f77bcf86cd799439011",
				locationId: "507f1f77bcf86cd799439012",
				startTime: new Date("2026-02-10T19:00:00"),
				maxPlayers: 8,
			};

			service.updateEvent(eventId, updateData).subscribe((event: Event) => {
				expect(event.title).toBe("Updated Game Night");
				expect(event.maxPlayers).toBe(8);
			});

			const req = httpMock.expectOne(`${apiUrl}/events/${eventId}`);
			expect(req.request.method).toBe("PATCH");
			expect(req.request.body).toEqual(updateData);
			req.flush(updatedEvent);
		});
	});

	describe("delete event", () => {
		it("should remove event when valid id provided", () => {
			const eventId = "507f1f77bcf86cd799439011";
			const deletedEvent: Event = {
				id: eventId,
				title: "Deleted Game Night",
				gameId: "507f1f77bcf86cd799439011",
				locationId: "507f1f77bcf86cd799439012",
				startTime: new Date("2026-02-10T19:00:00"),
			};

			service.deleteEvent(eventId).subscribe((event: Event) => {
				expect(event.id).toBe(eventId);
			});

			const req = httpMock.expectOne(`${apiUrl}/events/${eventId}`);
			expect(req.request.method).toBe("DELETE");
			req.flush(deletedEvent);
		});
	});
});
