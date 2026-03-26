import { FirebaseAdminProvider } from '@auth/infrastructure/firebase/firebase-admin.provider.js';
import { ERROR_CODE } from '@common/error-codes';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { events } from '@database/schema/events.js';
import { games } from '@database/schema/games.js';
import { locations } from '@database/schema/locations.js';
import type { SelectProfile } from '@database/schema/profiles.js';
import { profiles } from '@database/schema/profiles.js';
import type { UpdateProfileDto } from '@gamenight-hub/shared';
import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, eq, isNull, ne } from 'drizzle-orm';

const NAME_CHANGE_COOLDOWN_DAYS = 30;

@Injectable()
export class ProfileService {
	readonly #logger = new Logger(ProfileService.name);
	readonly #db: DrizzleDb;
	readonly #firebaseAdmin: FirebaseAdminProvider;
	readonly #eventEmitter: EventEmitter2;

	constructor(
		@Inject(DB_TOKEN) db: DrizzleDb,
		@Inject(FirebaseAdminProvider) firebaseAdmin: FirebaseAdminProvider,
		@Inject(EventEmitter2) eventEmitter: EventEmitter2,
	) {
		this.#db = db;
		this.#firebaseAdmin = firebaseAdmin;
		this.#eventEmitter = eventEmitter;
	}

	async getMyProfile(uid: string, email?: string): Promise<SelectProfile> {
		const [existing] = await this.#db
			.select()
			.from(profiles)
			.where(and(eq(profiles.uid, uid), isNull(profiles.deletedAt)));

		if (existing) return existing;

		const [created] = await this.#db
			.insert(profiles)
			.values({ uid, email: email ?? null, updatedAt: new Date() })
			.onConflictDoNothing()
			.returning();

		if (!created) {
			const [retry] = await this.#db
				.select()
				.from(profiles)
				.where(and(eq(profiles.uid, uid), isNull(profiles.deletedAt)));

			if (!retry) {
				const [deleted] = await this.#db
					.select({ deletedAt: profiles.deletedAt })
					.from(profiles)
					.where(eq(profiles.uid, uid));

				if (deleted?.deletedAt) {
					throw new NotFoundException({
						code: ERROR_CODE.PROFILE_NOT_FOUND,
						message: 'This account has been deleted',
					});
				}

				throw new InternalServerErrorException({
					code: ERROR_CODE.PROFILE_CREATE_FAILED,
					message: `Could not create or retrieve profile for uid: ${uid}`,
				});
			}

			return retry;
		}

		try {
			this.#eventEmitter.emit('profile.created', { userId: uid });
		} catch (err) {
			this.#logger.error(`Failed to emit profile.created for uid=${uid}`, err);
		}

		return created;
	}

	async updateMyProfile(uid: string, dto: UpdateProfileDto): Promise<SelectProfile> {
		await this.getMyProfile(uid);

		if (dto.username) {
			const [conflict] = await this.#db
				.select()
				.from(profiles)
				.where(
					and(
						eq(profiles.username, dto.username),
						ne(profiles.uid, uid),
						isNull(profiles.deletedAt),
					),
				);

			if (conflict) {
				throw new ConflictException({
					code: ERROR_CODE.DUPLICATE_USERNAME,
					message: `Username "${dto.username}" is already taken`,
				});
			}
		}

		const isSubmittingName = dto.firstName !== undefined || dto.lastName !== undefined;
		let nameChangedAt: Date | undefined;

		if (isSubmittingName) {
			const current = await this.getMyProfile(uid);
			const nameIsAlreadySet = current.firstName !== null || current.lastName !== null;

			const isActuallyChangingName =
				(dto.firstName !== undefined && dto.firstName !== current.firstName) ||
				(dto.lastName !== undefined && dto.lastName !== current.lastName);

			if (isActuallyChangingName && nameIsAlreadySet) {
				if (current.nameChangedAt !== null) {
					const daysSinceLastChange =
						(Date.now() - new Date(current.nameChangedAt).getTime()) / (1000 * 60 * 60 * 24);

					if (daysSinceLastChange < NAME_CHANGE_COOLDOWN_DAYS) {
						const daysRemaining = Math.ceil(NAME_CHANGE_COOLDOWN_DAYS - daysSinceLastChange);
						throw new BadRequestException({
							code: ERROR_CODE.NAME_CHANGE_COOLDOWN,
							message: `You can only change your name once every ${NAME_CHANGE_COOLDOWN_DAYS} days. Try again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
						});
					}
				}
				nameChangedAt = new Date();
			}
		}

		const [updated] = await this.#db
			.update(profiles)
			.set({
				...dto,
				...(nameChangedAt ? { nameChangedAt } : {}),
				updatedAt: new Date(),
			})
			.where(eq(profiles.uid, uid))
			.returning();

		return updated;
	}

	async getPublicProfile(username: string): Promise<SelectProfile> {
		const [profile] = await this.#db
			.select()
			.from(profiles)
			.where(and(eq(profiles.username, username), isNull(profiles.deletedAt)));

		if (!profile || !profile.isProfilePublic) {
			throw new NotFoundException({
				code: ERROR_CODE.PROFILE_NOT_FOUND,
				message: 'Profile not found',
			});
		}

		return profile;
	}

	async getDeletionEligibility(
		uid: string,
	): Promise<{ eligible: boolean; openEventsCount: number }> {
		const [{ value: openEventsCount }] = await this.#db
			.select({ value: count() })
			.from(events)
			.where(and(eq(events.createdBy, uid), isNull(events.deletedAt)));

		return { eligible: openEventsCount === 0, openEventsCount };
	}

	async deleteMyProfile(uid: string): Promise<{ success: true; message: string }> {
		this.#logger.log(`[deleteMyProfile] start uid=${uid}`);

		const [existing] = await this.#db.select().from(profiles).where(eq(profiles.uid, uid));

		if (!existing) {
			throw new NotFoundException({
				code: ERROR_CODE.PROFILE_NOT_FOUND,
				message: 'Profile not found',
			});
		}

		const { eligible, openEventsCount } = await this.getDeletionEligibility(uid);

		if (!eligible) {
			throw new ConflictException({
				code: ERROR_CODE.OPEN_EVENTS_EXIST,
				message: `You have ${openEventsCount} open event${openEventsCount === 1 ? '' : 's'}. Please close them before deleting your account.`,
			});
		}

		const now = new Date();

		try {
			this.#logger.log(`[deleteMyProfile] cascade-deleting games`);
			await this.#db.update(games).set({ deletedAt: now }).where(eq(games.createdBy, uid));

			this.#logger.log(`[deleteMyProfile] cascade-deleting events`);
			await this.#db.update(events).set({ deletedAt: now }).where(eq(events.createdBy, uid));

			this.#logger.log(`[deleteMyProfile] cascade-deleting locations`);
			await this.#db.update(locations).set({ deletedAt: now }).where(eq(locations.createdBy, uid));

			this.#logger.log(`[deleteMyProfile] soft-deleting profile row`);
			await this.#db
				.update(profiles)
				.set({
					deletedAt: now,
					username: null,
					email: null,
					backupEmail: null,
					mobilePhone: null,
					avatar: null,
					bio: null,
					location: null,
					postalZip: null,
					birthday: null,
					firstName: null,
					lastName: null,
					updatedAt: now,
				})
				.where(eq(profiles.uid, uid));
		} catch (dbErr: unknown) {
			this.#logger.error(`[deleteMyProfile] DB cascade failed: ${String(dbErr)}`);
			throw new InternalServerErrorException({
				code: ERROR_CODE.ACCOUNT_DELETE_FAILED,
				message: 'Failed to delete account data',
			});
		}

		try {
			this.#logger.log(`[deleteMyProfile] deleting Firebase user`);
			await this.#firebaseAdmin.getAuth().deleteUser(uid);
		} catch (firebaseErr: unknown) {
			this.#logger.error(
				`[deleteMyProfile] Firebase deleteUser failed (non-fatal, DB already cleaned): ${String(firebaseErr)}`,
			);
		}

		this.#logger.log(`[deleteMyProfile] done uid=${uid}`);
		return { success: true, message: 'Account deleted successfully' };
	}
}
