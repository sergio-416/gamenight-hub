import { AuthService } from '@auth/application/auth.service.js';
import { WebSocketAuthGuard } from '@auth/infrastructure/guards/websocket-auth.guard.js';
import type { EventCreatedPayload, LocationCreatedPayload } from '@gamenight-hub/shared';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
	MessageBody,
	type OnGatewayConnection,
	type OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@UseGuards(WebSocketAuthGuard)
@WebSocketGateway({
	cors: {
		origin: (
			origin: string | undefined,
			callback: (err: Error | null, allow?: boolean) => void,
		) => {
			const allowed = (process.env.FRONTEND_URL ?? 'http://localhost:4200')
				.split(',')
				.map((s) => s.trim());
			callback(null, !origin || allowed.includes(origin));
		},
		credentials: true,
	},
	namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	readonly server!: Server;

	readonly #logger = new Logger(NotificationsGateway.name);
	readonly #authService: AuthService;

	constructor(@Inject(AuthService) authService: AuthService) {
		this.#authService = authService;
	}

	async handleConnection(client: Socket) {
		const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
		const origin = client.handshake.headers.origin;
		if (origin && origin !== frontendUrl) {
			this.#logger.warn(`Client ${client.id} rejected: unexpected origin ${origin}`);
			client.disconnect();
			return;
		}

		const token = client.handshake.auth?.token as string | undefined;

		if (!token) {
			this.#logger.warn(`Client ${client.id} rejected: no token`);
			client.disconnect();
			return;
		}

		try {
			await this.#authService.verifyToken(token);
			this.#logger.log(`Client connected: ${client.id}`);
		} catch {
			this.#logger.warn(`Client ${client.id} rejected: invalid token`);
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket) {
		this.#logger.log(`Client disconnected: ${client.id}`);
	}

	@OnEvent('location.created')
	notifyLocationCreated(payload: LocationCreatedPayload) {
		try {
			this.server?.emit('location.created', payload);
		} catch (err) {
			this.#logger.error('Failed to emit location.created via WebSocket', err);
		}
	}

	@OnEvent('event.created')
	notifyEventCreated(payload: EventCreatedPayload) {
		try {
			this.server?.emit('event.created', payload);
		} catch (err) {
			this.#logger.error('Failed to emit event.created via WebSocket', err);
		}
	}

	@SubscribeMessage('ping')
	handlePing(@MessageBody() _data: unknown): string {
		return 'pong';
	}
}
