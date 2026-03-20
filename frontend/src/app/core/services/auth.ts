import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
	computed,
	Injectable,
	InjectionToken,
	Injector,
	inject,
	runInInjectionContext,
	signal,
} from '@angular/core';
import {
	Auth,
	GoogleAuthProvider,
	getAdditionalUserInfo,
	idToken,
	isSignInWithEmailLink,
	onAuthStateChanged,
	signInWithEmailLink,
	signInWithPopup,
	signOut,
	type User,
} from '@angular/fire/auth';
import type { UserRole, UserType } from '@gamenight-hub/shared';
import { firstValueFrom, type Observable, ReplaySubject } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { NotificationsService } from './notifications.service';

export function translateAuthError(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
		if (error.status === 400) return 'Please enter a valid email address.';
		return 'Something went wrong. Please try again or contact us if the problem persists.';
	}

	if (!(error instanceof Error)) {
		return 'Something went wrong. Please try again or contact us if the problem persists.';
	}

	const message = error.message;

	if (message.includes('invalid-email') || message.includes('INVALID_EMAIL')) {
		return 'Please enter a valid email address.';
	}

	if (message.includes('network-request-failed') || message.includes('NETWORK_ERROR')) {
		return 'Network error. Please check your connection and try again.';
	}

	if (message.includes('too-many-requests') || message.includes('TOO_MANY_ATTEMPTS')) {
		return 'Too many attempts. Please wait a moment and try again.';
	}

	if (message.includes('expired-action-code')) {
		return 'This sign-in link has expired. Please request a new one.';
	}

	if (message.includes('invalid-action-code')) {
		return 'This sign-in link has already been used. Please request a new one.';
	}

	return 'Something went wrong. Please try again or contact us if the problem persists.';
}

export const FIREBASE_AUTH_OPS = new InjectionToken<{
	onAuthStateChanged: typeof onAuthStateChanged;
	signInWithPopup: typeof signInWithPopup;
	signOut: typeof signOut;
	idToken: typeof idToken;
	isSignInWithEmailLink: typeof isSignInWithEmailLink;
	signInWithEmailLink: typeof signInWithEmailLink;
	getAdditionalUserInfo: typeof getAdditionalUserInfo;
}>('firebase-auth-ops', {
	factory: () => ({
		onAuthStateChanged,
		signInWithPopup,
		signOut,
		idToken,
		isSignInWithEmailLink,
		signInWithEmailLink,
		getAdditionalUserInfo,
	}),
});

function isUserRole(value: unknown): value is UserRole {
	return value === 'admin' || value === 'moderator' || value === 'user';
}

function isUserType(value: unknown): value is UserType {
	return value === 'regular' || value === 'store_organiser';
}

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	readonly #auth = inject(Auth);
	readonly #http = inject(HttpClient);
	readonly #injector = inject(Injector);
	readonly #notifications = inject(NotificationsService);
	readonly #authOps = inject(FIREBASE_AUTH_OPS);
	readonly #currentUser = signal<User | null>(null);
	readonly #userRole = signal<UserRole>('user');
	readonly #userType = signal<UserType>('regular');
	readonly #authStateUnsubscribe: () => void;

	readonly #authReady$ = new ReplaySubject<void>(1);
	readonly authReady$ = this.#authReady$.asObservable();

	readonly currentUser = this.#currentUser.asReadonly();
	readonly isLoggedIn = computed(() => this.#currentUser() !== null);
	readonly userRole = this.#userRole.asReadonly();
	readonly userType = this.#userType.asReadonly();

	readonly idToken$: Observable<string | null> = this.#authOps.idToken(this.#auth);

	constructor() {
		let authReadyEmitted = false;

		this.#authStateUnsubscribe = this.#authOps.onAuthStateChanged(this.#auth, async (user) => {
			this.#currentUser.set(user);

			if (!authReadyEmitted) {
				authReadyEmitted = true;
				this.#authReady$.next();
			}

			if (user) {
				const [token, tokenResult] = await Promise.all([
					user.getIdToken(),
					user.getIdTokenResult(),
				]);
				// biome-ignore lint/complexity/useLiteralKeys: claims is an index signature
				const rawRole = tokenResult.claims['role'];
				this.#userRole.set(isUserRole(rawRole) ? rawRole : 'user');
				// biome-ignore lint/complexity/useLiteralKeys: claims is an index signature
				const rawUserType = tokenResult.claims['userType'];
				this.#userType.set(isUserType(rawUserType) ? rawUserType : 'regular');
				this.#notifications.connect(token, user.uid);
			} else {
				this.#userRole.set('user');
				this.#userType.set('regular');
				this.#notifications.disconnect();
			}
		});
	}

	async login(): Promise<{ isNewUser: boolean }> {
		const credential = await runInInjectionContext(this.#injector, () =>
			this.#authOps.signInWithPopup(this.#auth, new GoogleAuthProvider()),
		);
		const additionalInfo = this.#authOps.getAdditionalUserInfo(credential);
		return { isNewUser: additionalInfo?.isNewUser ?? false };
	}

	async logout(): Promise<void> {
		await runInInjectionContext(this.#injector, () => this.#authOps.signOut(this.#auth));
	}

	async sendSignInLink(email: string): Promise<void> {
		const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.magicLink}`;
		await firstValueFrom(this.#http.post(url, { email }));
		localStorage.setItem('emailForSignIn', email);
	}

	async completeSignInWithLink(email: string, link: string): Promise<{ isNewUser: boolean }> {
		const isValid = this.#authOps.isSignInWithEmailLink(this.#auth, link);
		if (!isValid) {
			throw new Error('invalid-sign-in-link');
		}

		const credential = await runInInjectionContext(this.#injector, () =>
			this.#authOps.signInWithEmailLink(this.#auth, email, link),
		);

		const additionalInfo = this.#authOps.getAdditionalUserInfo(credential);
		return { isNewUser: additionalInfo?.isNewUser ?? false };
	}

	ngOnDestroy(): void {
		this.#authStateUnsubscribe();
	}
}
