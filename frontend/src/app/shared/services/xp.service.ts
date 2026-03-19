import { HttpClient, httpResource } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import type {
	XpAwardFeedback,
	XpHistoryResponse,
	XpProfile,
} from "@shared/models/xp.model";

@Injectable({ providedIn: "root" })
export class XpService {
	readonly #http = inject(HttpClient);
	readonly #base = API_CONFIG.baseUrl;

	readonly #profileResource = httpResource<XpProfile>(
		() => `${this.#base}${API_CONFIG.endpoints.xpProfile}`,
	);

	readonly profile = computed(() =>
		this.#profileResource.hasValue()
			? this.#profileResource.value()
			: undefined,
	);
	readonly profileLoading = computed(() => this.#profileResource.isLoading());
	readonly profileError = computed(() => this.#profileResource.error());

	readonly #xpFeedback = signal<XpAwardFeedback | null>(null);
	readonly xpFeedback = this.#xpFeedback.asReadonly();

	#feedbackTimer: ReturnType<typeof setTimeout> | null = null;

	refreshProfile(): void {
		this.#profileResource.reload();
	}

	getHistory(page: number, limit: number) {
		return this.#http.get<XpHistoryResponse>(
			`${this.#base}${API_CONFIG.endpoints.xpHistory}`,
			{ params: { page, limit } },
		);
	}

	showXpFeedback(feedback: XpAwardFeedback): void {
		if (this.#feedbackTimer) {
			clearTimeout(this.#feedbackTimer);
		}

		this.#xpFeedback.set(feedback);

		this.#feedbackTimer = setTimeout(() => {
			this.#xpFeedback.set(null);
			this.#feedbackTimer = null;
		}, 3000);
	}

	clearFeedback(): void {
		if (this.#feedbackTimer) {
			clearTimeout(this.#feedbackTimer);
			this.#feedbackTimer = null;
		}
		this.#xpFeedback.set(null);
	}
}
