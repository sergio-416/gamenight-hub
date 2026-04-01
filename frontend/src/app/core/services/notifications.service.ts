import { Injectable, InjectionToken, inject, type OnDestroy } from '@angular/core';
import { environment } from '@env';
import type { EventCreatedPayload } from '@gamenight-hub/shared';
import { TranslocoService } from '@jsverse/transloco';
import type { Socket } from 'socket.io-client';
import { ToastService } from './toast';

export type SocketFactory = (...args: unknown[]) => unknown;

export const SOCKET_FACTORY = new InjectionToken<SocketFactory | null>('SOCKET_FACTORY', {
	providedIn: 'root',
	factory: () => null,
});

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
	readonly #toast = inject(ToastService);
	readonly #transloco = inject(TranslocoService);
	readonly #socketFactory = inject(SOCKET_FACTORY);
	#socket: Socket | null = null;
	#currentUid: string | null = null;

	async connect(token: string, uid: string): Promise<void> {
		if (this.#socket) return;
		this.#currentUid = uid;

		const socketFactory = this.#socketFactory ?? (await import('socket.io-client')).io;

		this.#socket = socketFactory(`${environment.wsUrl}/notifications`, {
			auth: { token },
			transports: ['websocket'],
			reconnection: true,
			reconnectionDelay: 2000,
			reconnectionAttempts: 5,
		}) as Socket;

		this.#socket.on('event.created', (payload: EventCreatedPayload) => {
			if (payload.createdBy === this.#currentUid) return;
			this.#toast.info(
				this.#transloco.translate('notifications.newEvent', {
					title: payload.title,
				}),
			);
		});
	}

	disconnect(): void {
		this.#socket?.disconnect();
		this.#socket = null;
	}

	ngOnDestroy(): void {
		this.disconnect();
	}
}
