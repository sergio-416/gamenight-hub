import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import type { Observable } from 'rxjs';

export interface Participant {
	id: string;
	eventId: string;
	userId: string;
	username: string | null;
	avatar: string | null;
	status: 'joined';
	joinedAt: string;
}

const API_URL = API_CONFIG.baseUrl;

@Injectable({
	providedIn: 'root',
})
export class ParticipantsService {
	readonly #http = inject(HttpClient);

	joinEvent(eventId: string): Observable<Participant> {
		return this.#http.post<Participant>(`${API_URL}/events/${eventId}/join`, {});
	}

	leaveEvent(eventId: string): Observable<Participant> {
		return this.#http.delete<Participant>(`${API_URL}/events/${eventId}/join`);
	}
}
