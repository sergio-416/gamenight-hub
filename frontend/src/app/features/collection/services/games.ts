import { HttpClient, httpResource } from '@angular/common/http';
import { computed, Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@core/config/api.config';
import type { Observable } from 'rxjs';
import type { Game, GameSearchResult, PersonalFields } from '../models/game.model';

const API_URL = API_CONFIG.baseUrl;

@Injectable({
	providedIn: 'root',
})
export class GamesService {
	readonly #http = inject(HttpClient);

	readonly #ownedBggIdsResource = httpResource<number[]>(
		() => `${API_URL}${API_CONFIG.endpoints.ownedBggIds}`,
	);

	readonly ownedBggIds = computed(() =>
		this.#ownedBggIdsResource.hasValue()
			? new Set(this.#ownedBggIdsResource.value())
			: new Set<number>(),
	);

	reloadOwnedBggIds(): void {
		this.#ownedBggIdsResource.reload();
	}

	search(query: string): Observable<GameSearchResult[]> {
		return this.#http.get<GameSearchResult[]>(`${API_URL}${API_CONFIG.endpoints.search}`, {
			params: { query },
		});
	}

	importGame(bggId: number, personalFields: PersonalFields): Observable<Game> {
		return this.#http.post<Game>(
			`${API_URL}${API_CONFIG.endpoints.importGame}/${bggId}`,
			personalFields,
		);
	}

	updateGame(id: string, personalFields: Partial<PersonalFields>): Observable<Game> {
		return this.#http.patch<Game>(`${API_URL}${API_CONFIG.endpoints.games}/${id}`, personalFields);
	}

	deleteGame(id: string): Observable<Game> {
		return this.#http.delete<Game>(`${API_URL}${API_CONFIG.endpoints.games}/${id}`);
	}

	markAsPlayed(gameId: string): Observable<unknown> {
		return this.#http.post(`${API_URL}${API_CONFIG.endpoints.games}/${gameId}/mark-played`, {});
	}
}
