import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import type { Profile, UpdateProfileDto } from "@gamenight-hub/shared";
import { type Observable, tap } from "rxjs";

@Injectable({ providedIn: "root" })
export class ProfileService {
	readonly #http = inject(HttpClient);
	readonly #base = API_CONFIG.baseUrl;

	readonly #cachedProfile = signal<Profile | null>(null);
	readonly cachedProfile = this.#cachedProfile.asReadonly();

	getMyProfile(): Observable<Profile> {
		return this.#http
			.get<Profile>(`${this.#base}/profile/me`)
			.pipe(tap((profile) => this.#cachedProfile.set(profile)));
	}

	updateMyProfile(dto: UpdateProfileDto): Observable<Profile> {
		return this.#http
			.patch<Profile>(`${this.#base}/profile/me`, dto)
			.pipe(tap((profile) => this.#cachedProfile.set(profile)));
	}

	getDeletionEligibility(): Observable<{
		eligible: boolean;
		openEventsCount: number;
	}> {
		return this.#http.get<{ eligible: boolean; openEventsCount: number }>(
			`${this.#base}/profile/me/deletion-eligibility`,
		);
	}

	deleteMyAccount(): Observable<{ success: true; message: string }> {
		return this.#http
			.delete<{ success: true; message: string }>(`${this.#base}/profile`)
			.pipe(tap(() => this.#cachedProfile.set(null)));
	}

	clearCache(): void {
		this.#cachedProfile.set(null);
	}
}
