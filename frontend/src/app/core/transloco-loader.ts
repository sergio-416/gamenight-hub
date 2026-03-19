import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Translation, TranslocoLoader } from "@jsverse/transloco";

@Injectable({ providedIn: "root" })
export class TranslocoHttpLoader implements TranslocoLoader {
	readonly #http = inject(HttpClient);

	getTranslation(langOrScope: string) {
		const parts = langOrScope.split("/");
		const [scope, lang] =
			parts.length > 1 ? [parts[0], parts[1]] : [null, parts[0]];
		const file = scope ?? "shared";
		return this.#http.get<Translation>(`/i18n/${lang}/${file}.json`);
	}
}
