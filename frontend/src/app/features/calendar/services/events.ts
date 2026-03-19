import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import type { Observable } from "rxjs";
import type {
	CreateCalendarEvent,
	Event,
	UpdateCalendarEvent,
} from "../models/event.model";

const API_URL = API_CONFIG.baseUrl;

@Injectable({
	providedIn: "root",
})
export class EventsService {
	readonly #http = inject(HttpClient);

	createEvent(event: CreateCalendarEvent): Observable<Event> {
		return this.#http.post<Event>(`${API_URL}/events`, event);
	}

	updateEvent(id: string, event: UpdateCalendarEvent): Observable<Event> {
		return this.#http.patch<Event>(`${API_URL}/events/${id}`, event);
	}

	deleteEvent(id: string): Observable<Event> {
		return this.#http.delete<Event>(`${API_URL}/events/${id}`);
	}
}
