import { IMAGE_LOADER, type ImageLoaderConfig } from "@angular/common";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
	type ApplicationConfig,
	inject,
	isDevMode,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from "@angular/core";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { provideRouter } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { provideTransloco, TranslocoService } from "@jsverse/transloco";
import { firstValueFrom } from "rxjs";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth";
import { PwaInstallService } from "./core/services/pwa-install.service";
import { PwaUpdateService } from "./core/services/pwa-update.service";
import { TranslocoHttpLoader } from "./core/transloco-loader";

const AVAILABLE_LANGS = ["en", "es", "ca", "fr", "de", "pt", "it"] as const;
const STORAGE_KEY = "transloco-lang";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideHttpClient(withInterceptors([authInterceptor])),
		provideFirebaseApp(() => initializeApp(environment.firebase)),
		provideAuth(() => getAuth()),
		provideFirestore(() => getFirestore()),
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000",
		}),
		provideAppInitializer(() => {
			inject(PwaUpdateService);
		}),
		provideAppInitializer(() => {
			inject(PwaInstallService);
		}),
		{
			provide: IMAGE_LOADER,
			useValue: (config: ImageLoaderConfig) => {
				return config.src;
			},
		},
		provideTransloco({
			config: {
				availableLangs: [...AVAILABLE_LANGS],
				defaultLang: "en",
				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
				scopes: { keepCasing: true },
			},
			loader: TranslocoHttpLoader,
		}),
		provideAppInitializer(() => {
			const service = inject(TranslocoService);
			const stored = localStorage.getItem(STORAGE_KEY);
			const lang =
				stored && (AVAILABLE_LANGS as readonly string[]).includes(stored)
					? stored
					: "en";
			service.setActiveLang(lang);
			return firstValueFrom(service.load(lang));
		}),
	],
};
