import { ERROR_CODE } from '@common/error-codes';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { events } from '@database/schema/events.js';
import { participants } from '@database/schema/participants.js';
import { profiles } from '@database/schema/profiles.js';
import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, eq, isNull } from 'drizzle-orm';
import { ParticipantJoinedEvent } from '../../xp/domain/xp-events.js';

@Injectable()
export class ParticipantsService {
	readonly #logger = new Logger(ParticipantsService.name);
	readonly #db: DrizzleDb;
	readonly #eventEmitter: EventEmitter2;

	constructor(@Inject(DB_TOKEN) db: DrizzleDb, @Inject(EventEmitter2) eventEmitter: EventEmitter2) {
		this.#db = db;
		this.#eventEmitter = eventEmitter;
	}

	async join(eventId: string, userId: string) {
		let hostId: string | null = null;

		const result = await this.#db.transaction(async (tx) => {
			const [event] = await tx
				.select()
				.from(events)
				.where(and(eq(events.id, eventId), isNull(events.deletedAt)))
				.for('update');

			if (!event)
				throw new NotFoundException({
					code: ERROR_CODE.EVENT_NOT_FOUND,
					message: `Event with id ${eventId} not found`,
				});

			hostId = event.createdBy;

			const [existing] = await tx
				.select()
				.from(participants)
				.where(and(eq(participants.eventId, eventId), eq(participants.userId, userId)))
				.for('update');

			if (existing && existing.status === 'joined') {
				throw new ConflictException({
					code: ERROR_CODE.ALREADY_JOINED,
					message: 'Already joined',
				});
			}

			if (event.maxPlayers) {
				const [{ value: currentCount }] = await tx
					.select({ value: count() })
					.from(participants)
					.where(and(eq(participants.eventId, eventId), eq(participants.status, 'joined')));

				if (currentCount >= event.maxPlayers) {
					throw new ConflictException({
						code: ERROR_CODE.EVENT_FULL,
						message: 'Event is full',
					});
				}
			}

			if (existing) {
				const [updated] = await tx
					.update(participants)
					.set({
						status: 'joined',
						joinedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(participants.id, existing.id))
					.returning();

				return updated;
			}

			const [created] = await tx
				.insert(participants)
				.values({
					eventId,
					userId,
					status: 'joined',
				})
				.returning();

			return created;
		});

		if (hostId) {
			try {
				await this.#eventEmitter.emitAsync(
					'participant.joined',
					new ParticipantJoinedEvent(userId, eventId, hostId),
				);
			} catch (err) {
				this.#logger.error('Failed to emit participant.joined event', err);
			}
		}

		return result;
	}

	async leave(eventId: string, userId: string) {
		const [existing] = await this.#db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.eventId, eventId),
					eq(participants.userId, userId),
					eq(participants.status, 'joined'),
				),
			);

		if (!existing)
			throw new NotFoundException({
				code: ERROR_CODE.NOT_A_PARTICIPANT,
				message: 'Not a participant',
			});

		const [updated] = await this.#db
			.update(participants)
			.set({
				status: 'cancelled',
				updatedAt: new Date(),
			})
			.where(eq(participants.id, existing.id))
			.returning();

		return updated;
	}

	async findByEvent(eventId: string) {
		return this.#db
			.select({
				id: participants.id,
				eventId: participants.eventId,
				userId: participants.userId,
				status: participants.status,
				joinedAt: participants.joinedAt,
				username: profiles.username,
				avatar: profiles.avatar,
			})
			.from(participants)
			.innerJoin(profiles, eq(participants.userId, profiles.uid))
			.where(and(eq(participants.eventId, eventId), eq(participants.status, 'joined')));
	}

	async getParticipantCount(eventId: string) {
		const [{ value }] = await this.#db
			.select({ value: count() })
			.from(participants)
			.where(and(eq(participants.eventId, eventId), eq(participants.status, 'joined')));

		return value;
	}

	async getUserStatus(eventId: string, userId: string) {
		const [participant] = await this.#db
			.select()
			.from(participants)
			.where(and(eq(participants.eventId, eventId), eq(participants.userId, userId)));

		return participant?.status ?? null;
	}
}
